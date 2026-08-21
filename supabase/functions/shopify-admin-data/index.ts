import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE_DOMAIN = "cnhtj8-x9.myshopify.com";
const SHOPIFY_ADMIN_API_VERSION = "2024-10";
const SHOPIFY_ADMIN_GRAPHQL_URL =
  `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Resolve the calling user's id from their JWT (the platform already verified it
// because this function keeps verify_jwt=true). Returns null when unauthenticated.
async function getCallerId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) return null;
  return String(data.claims.sub);
}

// Turn a stored Shopify order id (numeric string, or already a gid) into a gid.
function orderGid(id: string): string {
  const s = String(id);
  return s.startsWith("gid://") ? s : `gid://shopify/Order/${s}`;
}

// Same, for a Subscription Contract id.
function contractGid(id: string): string {
  const s = String(id);
  return s.startsWith("gid://") ? s : `gid://shopify/SubscriptionContract/${s}`;
}

// First userErrors[].message from a mutation payload, or null.
function firstUserError(payload: any): string | null {
  const errs = payload?.userErrors;
  return Array.isArray(errs) && errs.length ? (errs[0]?.message || "Request failed") : null;
}

async function shopifyGraphQL(query: string, variables: Record<string, unknown>) {
  const token = Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
  if (!token) throw new Error("SHOPIFY_ADMIN_ACCESS_TOKEN is not configured");
  const res = await fetch(SHOPIFY_ADMIN_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) {
    console.error("Shopify Admin GraphQL error:", res.status, JSON.stringify(body.errors));
    throw new Error(`Shopify Admin API error [${res.status}]`);
  }
  return body.data;
}

const money = (set: any) => set?.shopMoney
  ? { amount: Number(set.shopMoney.amount), currency: set.shopMoney.currencyCode }
  : null;

const ORDER_FIELDS = `
  id
  name
  processedAt
  createdAt
  displayFinancialStatus
  displayFulfillmentStatus
  paymentGatewayNames
  totalPriceSet { shopMoney { amount currencyCode } }
  subtotalPriceSet { shopMoney { amount currencyCode } }
  totalTaxSet { shopMoney { amount currencyCode } }
  totalShippingPriceSet { shopMoney { amount currencyCode } }
  totalRefundedSet { shopMoney { amount currencyCode } }
`;

function normalizeOrder(o: any) {
  if (!o) return null;
  return {
    id: o.id,
    name: o.name,
    processedAt: o.processedAt || o.createdAt || null,
    financialStatus: o.displayFinancialStatus || null,
    fulfillmentStatus: o.displayFulfillmentStatus || null,
    paymentGateways: o.paymentGatewayNames || [],
    total: money(o.totalPriceSet),
    subtotal: money(o.subtotalPriceSet),
    tax: money(o.totalTaxSet),
    shipping: money(o.totalShippingPriceSet),
    refunded: money(o.totalRefundedSet),
    lineItems: (o.lineItems?.nodes || []).map((li: any) => ({
      title: li.title,
      quantity: li.quantity,
      sku: li.sku || null,
      unitPrice: money(li.originalUnitPriceSet),
    })),
    shippingAddress: o.shippingAddress
      ? {
          name: o.shippingAddress.name,
          address1: o.shippingAddress.address1,
          address2: o.shippingAddress.address2,
          city: o.shippingAddress.city,
          province: o.shippingAddress.province,
          zip: o.shippingAddress.zip,
          country: o.shippingAddress.country,
          phone: o.shippingAddress.phone,
        }
      : null,
    payment: (o.transactions || [])
      .map((t: any) => ({
        gateway: t.gateway,
        kind: t.kind,
        status: t.status,
        // Shopify's Admin API does NOT expose the card last-4; `company` is the
        // brand (e.g. "American Express") and `wallet` covers Apple/Shop Pay.
        cardCompany: t.paymentDetails?.company ?? null,
        cardLast4: null,
        wallet: t.paymentDetails?.wallet ?? null,
        methodName: t.paymentDetails?.paymentMethodName ?? null,
      }))
      .find((t: any) => t.cardCompany || t.wallet || t.gateway) || null,
    fulfillments: (o.fulfillments || []).map((f: any) => ({
      status: f.status,
      tracking: (f.trackingInfo || []).map((ti: any) => ({
        company: ti.company, number: ti.number, url: ti.url,
      })),
    })),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const callerId = await getCallerId(req);
    if (!callerId) return json({ error: "Not authenticated" }, 401);

    // Service-role client to read book/role rows past RLS.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    // Staff run the same dashboard as the owner (everything but delete), so the
    // admin-only actions here answer to either role.
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", callerId)
      .in("role", ["admin", "staff"]).limit(1).maybeSingle();
    const isAdmin = !!roleRow;

    const { action, bookId, userId, subscriptionId, address, sellingPlanId } = await req.json();

    // Load a LOCAL subscription (past RLS) and verify the caller owns it, then
    // return its Shopify contract gid. Every subscription-management action goes
    // through this so a user can only ever touch their own subscription.
    const loadOwnedContract = async () => {
      if (!subscriptionId) return { err: json({ error: "subscriptionId required" }, 400) };
      const { data: sub } = await admin
        .from("subscriptions")
        .select("id, user_id, shopify_contract_id, status")
        .eq("id", subscriptionId).maybeSingle();
      if (!sub) return { err: json({ error: "Subscription not found" }, 404) };
      if (!isAdmin && sub.user_id !== callerId) return { err: json({ error: "Forbidden" }, 403) };
      if (!sub.shopify_contract_id) return { err: json({ hasContract: false }) };
      return { sub, cid: contractGid(String(sub.shopify_contract_id)) };
    };

    // ── order: full financials for a single order ──
    if (action === "order") {
      if (!bookId) return json({ error: "bookId required" }, 400);
      const { data: book } = await admin
        .from("books").select("id, user_id, shopify_order_id, shopify_order_name").eq("id", bookId).maybeSingle();
      if (!book) return json({ error: "Book not found" }, 404);
      if (!isAdmin && book.user_id !== callerId) return json({ error: "Forbidden" }, 403);
      if (!book.shopify_order_id) return json({ hasOrder: false });

      const query = `query($id: ID!) {
        order(id: $id) {
          ${ORDER_FIELDS}
          lineItems(first: 30) { nodes { title quantity sku originalUnitPriceSet { shopMoney { amount currencyCode } } } }
          shippingAddress { name address1 address2 city province zip country phone }
          transactions(first: 10) { gateway kind status paymentDetails { ... on CardPaymentDetails { company name wallet paymentMethodName } } }
          fulfillments(first: 10) { status trackingInfo { company number url } }
        }
      }`;
      const data = await shopifyGraphQL(query, { id: orderGid(book.shopify_order_id) });
      return json({ hasOrder: true, order: normalizeOrder(data.order) });
    }

    // ── user-orders-summary: lightweight totals for all of a user's orders ──
    if (action === "user-orders-summary") {
      const targetUserId = (isAdmin && userId) ? userId : callerId;
      const { data: books } = await admin
        .from("books")
        .select("id, shopify_order_id, shopify_order_name, created_at, paid_at")
        .eq("user_id", targetUserId)
        .not("shopify_order_id", "is", null);

      const rows = books || [];
      if (rows.length === 0) return json({ orders: [], totalSpent: 0, currency: null });

      const ids = rows.map((b: any) => orderGid(b.shopify_order_id));
      const query = `query($ids: [ID!]!) {
        nodes(ids: $ids) { ... on Order { ${ORDER_FIELDS} } }
      }`;
      const data = await shopifyGraphQL(query, { ids });
      const byGid = new Map<string, any>();
      for (const n of (data.nodes || [])) if (n?.id) byGid.set(n.id, normalizeOrder(n));

      let totalSpent = 0;
      let currency: string | null = null;
      const orders = rows.map((b: any) => {
        const o = byGid.get(orderGid(b.shopify_order_id));
        const paid = o && /paid|partially_refunded/i.test(o.financialStatus || "");
        if (o?.total) {
          if (paid) totalSpent += o.total.amount - (o.refunded?.amount || 0);
          currency = currency || o.total.currency;
        }
        return {
          bookId: b.id,
          orderName: b.shopify_order_name || o?.name || null,
          placedAt: b.paid_at || o?.processedAt || b.created_at,
          total: o?.total || null,
          subtotal: o?.subtotal || null,
          refunded: o?.refunded || null,
          financialStatus: o?.financialStatus || null,
          fulfillmentStatus: o?.fulfillmentStatus || null,
          payment: o?.paymentGateways?.[0] || null,
        };
      });
      return json({ orders, totalSpent: Math.round(totalSpent * 100) / 100, currency });
    }

    // ── revenue-summary (admin only): totals for EVERY order on the store's
    // books - feeds the admin dashboard's revenue/profit/expense analytics. ──
    if (action === "revenue-summary") {
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
      const { data: books } = await admin
        .from("books")
        .select("id, user_id, shopify_order_id, shopify_order_name, created_at, paid_at")
        .not("shopify_order_id", "is", null);

      const rows = books || [];
      if (rows.length === 0) return json({ orders: [], totalRevenue: 0, currency: null });

      // nodes() caps around 250 ids - chunk to stay well clear.
      const byGid = new Map<string, any>();
      for (let i = 0; i < rows.length; i += 100) {
        const ids = rows.slice(i, i + 100).map((b: any) => orderGid(b.shopify_order_id));
        const data = await shopifyGraphQL(
          `query($ids: [ID!]!) { nodes(ids: $ids) { ... on Order { ${ORDER_FIELDS} } } }`,
          { ids },
        );
        for (const n of (data.nodes || [])) if (n?.id) byGid.set(n.id, normalizeOrder(n));
      }

      let totalRevenue = 0;
      let currency: string | null = null;
      const orders = rows.map((b: any) => {
        const o = byGid.get(orderGid(b.shopify_order_id));
        const paid = o && /paid|partially_refunded/i.test(o.financialStatus || "");
        const net = o?.total ? o.total.amount - (o.refunded?.amount || 0) : 0;
        if (paid && o?.total) {
          totalRevenue += net;
          currency = currency || o.total.currency;
        }
        return {
          bookId: b.id,
          userId: b.user_id,
          orderName: b.shopify_order_name || o?.name || null,
          placedAt: b.paid_at || o?.processedAt || b.created_at,
          totalUsd: o?.total?.amount ?? null,
          netUsd: paid ? Math.round(net * 100) / 100 : 0,
          paid: !!paid,
          financialStatus: o?.financialStatus || null,
        };
      });
      return json({ orders, totalRevenue: Math.round(totalRevenue * 100) / 100, currency });
    }

    // ── subscription-detail: contract status, next billing, address, card ──
    if (action === "subscription-detail") {
      const { err, cid } = await loadOwnedContract();
      if (err) return err;
      const query = `query($id: ID!) {
        subscriptionContract(id: $id) {
          id
          status
          nextBillingDate
          currencyCode
          billingPolicy { interval intervalCount }
          lines(first: 5) { edges { node { title variantTitle quantity } } }
          deliveryMethod {
            __typename
            ... on SubscriptionDeliveryMethodShipping {
              address { firstName lastName address1 address2 city province zip country countryCode phone company }
            }
          }
          customerPaymentMethod {
            id
            instrument {
              __typename
              ... on CustomerCreditCard { brand lastDigits expiryMonth expiryYear name }
              ... on CustomerPaypalBillingAgreement { paypalAccountEmail }
            }
          }
        }
      }`;
      const data = await shopifyGraphQL(query, { id: cid });
      const c = data.subscriptionContract;
      if (!c) return json({ hasContract: false });
      const ship = c.deliveryMethod?.address || null;
      const inst = c.customerPaymentMethod?.instrument || null;
      return json({
        hasContract: true,
        contract: {
          id: c.id,
          status: c.status,
          nextBillingDate: c.nextBillingDate,
          currency: c.currencyCode,
          interval: c.billingPolicy?.interval || null,
          intervalCount: c.billingPolicy?.intervalCount || null,
          lines: (c.lines?.edges || []).map((e: any) => ({
            title: e.node.title, variantTitle: e.node.variantTitle, quantity: e.node.quantity,
          })),
          address: ship ? {
            firstName: ship.firstName, lastName: ship.lastName,
            address1: ship.address1, address2: ship.address2, city: ship.city,
            province: ship.province, zip: ship.zip, country: ship.country,
            countryCode: ship.countryCode, phone: ship.phone,
          } : null,
          paymentMethodId: c.customerPaymentMethod?.id || null,
          card: inst?.__typename === "CustomerCreditCard" ? {
            brand: inst.brand, last4: inst.lastDigits, expMonth: inst.expiryMonth, expYear: inst.expiryYear, name: inst.name,
          } : null,
          paypalEmail: inst?.__typename === "CustomerPaypalBillingAgreement" ? inst.paypalAccountEmail : null,
        },
      });
    }

    // ── subscription-address: update the delivery address (draft → commit) ──
    if (action === "subscription-address") {
      const { err, cid } = await loadOwnedContract();
      if (err) return err;
      if (!address || typeof address !== "object") return json({ error: "address required" }, 400);
      // 1. open a draft
      const start = await shopifyGraphQL(
        `mutation($id: ID!) { subscriptionContractUpdate(contractId: $id) { draft { id } userErrors { message } } }`,
        { id: cid },
      );
      const startErr = firstUserError(start.subscriptionContractUpdate);
      if (startErr) return json({ error: startErr }, 400);
      const draftId = start.subscriptionContractUpdate?.draft?.id;
      if (!draftId) return json({ error: "Could not open subscription draft" }, 500);
      // 2. set the shipping address on the draft
      const mailing = {
        firstName: address.firstName ?? null, lastName: address.lastName ?? null,
        address1: address.address1 ?? null, address2: address.address2 ?? null,
        city: address.city ?? null, province: address.province ?? null,
        country: address.country ?? null, zip: address.zip ?? null, phone: address.phone ?? null,
      };
      const upd = await shopifyGraphQL(
        `mutation($draftId: ID!, $input: SubscriptionDraftInput!) {
          subscriptionDraftUpdate(draftId: $draftId, input: $input) { draft { id } userErrors { message } }
        }`,
        { draftId, input: { deliveryMethod: { shipping: { address: mailing } } } },
      );
      const updErr = firstUserError(upd.subscriptionDraftUpdate);
      if (updErr) return json({ error: updErr }, 400);
      // 3. commit
      const commit = await shopifyGraphQL(
        `mutation($draftId: ID!) { subscriptionDraftCommit(draftId: $draftId) { contract { id } userErrors { message } } }`,
        { draftId },
      );
      const commitErr = firstUserError(commit.subscriptionDraftCommit);
      if (commitErr) return json({ error: commitErr }, 400);
      // Mirror the address onto the local row so the dashboard shows it immediately.
      await admin.from("subscriptions")
        .update({ shipping_data: address, updated_at: new Date().toISOString() } as any)
        .eq("id", subscriptionId);
      return json({ ok: true });
    }

    // ── subscription pause / resume / cancel ──
    if (action === "subscription-pause" || action === "subscription-resume" || action === "subscription-cancel") {
      const { err, cid } = await loadOwnedContract();
      if (err) return err;
      const map = {
        "subscription-pause":  { mut: "subscriptionContractPause",    status: "paused" },
        "subscription-resume": { mut: "subscriptionContractActivate", status: "active" },
        "subscription-cancel": { mut: "subscriptionContractCancel",   status: "canceled" },
      } as const;
      const { mut, status } = map[action as keyof typeof map];
      const data = await shopifyGraphQL(
        `mutation($id: ID!) { ${mut}(subscriptionContractId: $id) { contract { id status } userErrors { message } } }`,
        { id: cid },
      );
      const uerr = firstUserError(data[mut]);
      if (uerr) return json({ error: uerr }, 400);
      // Mirror status locally for instant dashboard feedback (the webhook also does).
      await admin.from("subscriptions")
        .update({ status, ...(status === "canceled" ? { canceled_at: new Date().toISOString() } : {}), updated_at: new Date().toISOString() } as any)
        .eq("id", subscriptionId);
      return json({ ok: true, status });
    }

    // ── subscription-migrate: move a retired weekly contract onto the Parsha
    // ── Series (monthly). ADMIN ONLY - it changes what a real customer is
    // ── charged, so it is never reachable by the subscriber themselves.
    //
    // A contract's selling plan cannot be swapped in place. The edit is made
    // through a DRAFT: open one on the live contract, repoint its line at the
    // target selling plan, and commit. Shopify recalculates the billing policy
    // and price from the plan, so we do NOT set an amount here - sending our own
    // would risk billing something the plan does not agree with.
    //
    // The local `frequency` is only mirrored AFTER Shopify commits. If the draft
    // fails we leave the row alone: a database that says "monthly" while Shopify
    // still bills weekly is worse than one that is merely out of date.
    if (action === "subscription-migrate") {
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
      const targetPlanId: string | undefined = sellingPlanId;
      if (!targetPlanId) return json({ error: "sellingPlanId required" }, 400);
      const { err, cid, sub } = await loadOwnedContract();
      if (err) return err;

      // What is on the contract now - we need the line id to repoint it.
      const detail = await shopifyGraphQL(
        `query($id: ID!) {
          subscriptionContract(id: $id) {
            id
            status
            billingPolicy { interval intervalCount }
            lines(first: 10) { edges { node { id quantity } } }
          }
        }`,
        { id: cid },
      );
      const contract = detail.subscriptionContract;
      if (!contract) return json({ error: "Contract not found in Shopify" }, 404);
      if (contract.status !== "ACTIVE" && contract.status !== "PAUSED") {
        return json({ error: `Contract is ${contract.status} - only an active or paused one can be migrated` }, 400);
      }
      const lines = (contract.lines?.edges || []).map((e: any) => e.node);
      if (lines.length !== 1) {
        // Multi-line contracts need a human decision about which line moves.
        return json({ error: `Contract has ${lines.length} lines - migrate this one by hand in Shopify` }, 400);
      }

      const draftRes = await shopifyGraphQL(
        `mutation($id: ID!) { subscriptionContractUpdate(contractId: $id) { draft { id } userErrors { message } } }`,
        { id: cid },
      );
      const draftErr = firstUserError(draftRes.subscriptionContractUpdate);
      if (draftErr) return json({ error: draftErr }, 400);
      const draftId = draftRes.subscriptionContractUpdate?.draft?.id;
      if (!draftId) return json({ error: "Shopify did not return a draft" }, 500);

      const lineRes = await shopifyGraphQL(
        `mutation($draftId: ID!, $lineId: ID!, $input: SubscriptionLineUpdateInput!) {
          subscriptionDraftLineUpdate(draftId: $draftId, lineId: $lineId, input: $input) {
            lineUpdated { id }
            userErrors { message }
          }
        }`,
        { draftId, lineId: lines[0].id, input: { sellingPlanId: targetPlanId } },
      );
      const lineErr = firstUserError(lineRes.subscriptionDraftLineUpdate);
      if (lineErr) return json({ error: lineErr }, 400);

      const commitRes = await shopifyGraphQL(
        `mutation($draftId: ID!) {
          subscriptionDraftCommit(draftId: $draftId) {
            contract { id status billingPolicy { interval intervalCount } }
            userErrors { message }
          }
        }`,
        { draftId },
      );
      const commitErr = firstUserError(commitRes.subscriptionDraftCommit);
      if (commitErr) return json({ error: commitErr }, 400);
      const updated = commitRes.subscriptionDraftCommit?.contract;

      // Shopify has committed - only now does the local row follow.
      await admin.from("subscriptions")
        .update({ frequency: "monthly", updated_at: new Date().toISOString() } as any)
        .eq("id", subscriptionId);

      console.log(`subscription-migrate: ${subscriptionId} (${sub?.id}) -> monthly, contract ${cid}`);
      return json({
        ok: true,
        frequency: "monthly",
        billingPolicy: updated?.billingPolicy ?? null,
        was: contract.billingPolicy ?? null,
      });
    }

    // ── subscription-card-url: Shopify's SECURE hosted card-update URL ──
    // Card entry stays PCI-safe on Shopify; the dashboard just opens this URL.
    if (action === "subscription-card-url") {
      const { err, cid } = await loadOwnedContract();
      if (err) return err;
      const detail = await shopifyGraphQL(
        `query($id: ID!) { subscriptionContract(id: $id) { customerPaymentMethod { id } } }`,
        { id: cid },
      );
      const pmId = detail.subscriptionContract?.customerPaymentMethod?.id;
      if (!pmId) return json({ error: "No payment method on this subscription" }, 400);
      const res = await shopifyGraphQL(
        `mutation($id: ID!) { customerPaymentMethodGetUpdateUrl(customerPaymentMethodId: $id) { updatePaymentMethodUrl userErrors { message } } }`,
        { id: pmId },
      );
      const uerr = firstUserError(res.customerPaymentMethodGetUpdateUrl);
      if (uerr) return json({ error: uerr }, 400);
      const url = res.customerPaymentMethodGetUpdateUrl?.updatePaymentMethodUrl;
      if (!url) return json({ error: "Could not get a card-update link" }, 500);
      return json({ url });
    }

    // ── subscription-card-email: Shopify emails the customer a SECURE link to
    // ── replace the card on this subscription.
    // Card data can never touch our servers (PCI), so the entry form has to be
    // the processor's. The direct updatePaymentMethodUrl above now lands in
    // Shopify's new customer-accounts portal - a list of invoices with no card
    // form - so this sends the customer straight to the real form instead.
    if (action === "subscription-card-email") {
      const { err, cid } = await loadOwnedContract();
      if (err) return err;
      const detail = await shopifyGraphQL(
        `query($id: ID!) { subscriptionContract(id: $id) { customerPaymentMethod { id } } }`,
        { id: cid },
      );
      const pmId = detail.subscriptionContract?.customerPaymentMethod?.id;
      if (!pmId) return json({ error: "No payment method on this subscription" }, 400);
      const res = await shopifyGraphQL(
        `mutation($id: ID!) { customerPaymentMethodSendUpdateEmail(customerPaymentMethodId: $id) { customer { id email } userErrors { message } } }`,
        { id: pmId },
      );
      const uerr = firstUserError(res.customerPaymentMethodSendUpdateEmail);
      if (uerr) return json({ error: uerr }, 400);
      return json({ sent: true, email: res.customerPaymentMethodSendUpdateEmail?.customer?.email ?? null });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("shopify-admin-data error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
