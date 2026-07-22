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

    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    const isAdmin = !!roleRow;

    const { action, bookId, userId } = await req.json();

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
    // books — feeds the admin dashboard's revenue/profit/expense analytics. ──
    if (action === "revenue-summary") {
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
      const { data: books } = await admin
        .from("books")
        .select("id, user_id, shopify_order_id, shopify_order_name, created_at, paid_at")
        .not("shopify_order_id", "is", null);

      const rows = books || [];
      if (rows.length === 0) return json({ orders: [], totalRevenue: 0, currency: null });

      // nodes() caps around 250 ids — chunk to stay well clear.
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

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("shopify-admin-data error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
