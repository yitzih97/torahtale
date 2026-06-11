import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STORE_PERMANENT_DOMAIN = "cnhtj8-x9.myshopify.com";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STOREFRONT_TOKEN = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
    if (!STOREFRONT_TOKEN) {
      throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not configured");
    }

    const body = await req.json();
    const lines = Array.isArray(body?.lines) ? body.lines : null;
    if (!lines || lines.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing 'lines' array with at least one item." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each line. A `sellingPlanId` (gid://shopify/SellingPlan/...) turns the
    // line into a recurring subscription purchase; it is optional and only forwarded
    // when well-formed.
    const cleanLines = lines
      .filter((l: any) => typeof l?.merchandiseId === "string" && l.merchandiseId.startsWith("gid://shopify/ProductVariant/"))
      .map((l: any) => {
        const line: { merchandiseId: string; quantity: number; sellingPlanId?: string } = {
          merchandiseId: l.merchandiseId,
          quantity: Math.max(1, Math.min(parseInt(l.quantity) || 1, 100)),
        };
        if (typeof l?.sellingPlanId === "string" && l.sellingPlanId.startsWith("gid://shopify/SellingPlan/")) {
          line.sellingPlanId = l.sellingPlanId;
        }
        return line;
      });

    if (cleanLines.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid merchandiseId provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cart attributes ({key,value}) survive onto the resulting order's note_attributes,
    // which is how shopify-webhook correlates the paid order back to the book.
    const attributes = Array.isArray(body?.attributes)
      ? body.attributes
          .filter((a: any) => typeof a?.key === "string" && typeof a?.value === "string")
          .map((a: any) => ({ key: a.key, value: a.value }))
      : [];

    const cartInput: Record<string, unknown> = { lines: cleanLines };
    if (attributes.length > 0) cartInput.attributes = attributes;

    const shopifyRes = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: CART_CREATE_MUTATION,
        variables: { input: cartInput },
      }),
    });

    const text = await shopifyRes.text();
    if (!shopifyRes.ok) {
      console.error("Shopify HTTP error:", shopifyRes.status, text);
      // Build a direct-to-store cart URL — this is a real, working Shopify
      // checkout entry point and will succeed even when the Storefront API
      // is unavailable (e.g. 402 = store billing plan inactive).
      const fallbackUrl = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/cart/${cleanLines
        .map((l: any) => `${l.merchandiseId.split("/").pop()}:${l.quantity}`)
        .join(",")}?channel=online_store&attributes[order_source]=torahtale_app`;
      return new Response(
        JSON.stringify({
          error: `Shopify error [${shopifyRes.status}]`,
          checkoutUrl: fallbackUrl,
          fallback: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(text);
    const userErrors = data?.data?.cartCreate?.userErrors || [];
    if (userErrors.length > 0) {
      console.error("Shopify userErrors:", userErrors);
      return new Response(
        JSON.stringify({ error: userErrors.map((e: any) => e.message).join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cart = data?.data?.cartCreate?.cart;
    if (!cart?.checkoutUrl) {
      return new Response(
        JSON.stringify({ error: "Shopify did not return a checkoutUrl." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        cartId: cart.id,
        checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
        lineId: cart.lines?.edges?.[0]?.node?.id ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("shopify-create-checkout error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
