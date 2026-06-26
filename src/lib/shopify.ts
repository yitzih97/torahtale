import { toast } from "sonner";

const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'cnhtj8-x9.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
// Token from the TorahTale Integration app — includes unauthenticated_read_selling_plans,
// required for subscription (selling plan) checkout lines.
const SHOPIFY_STOREFRONT_TOKEN = '370f86bdf115e6b0593f7248f5cfb4b0';

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          availableForSale: boolean;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

export async function storefrontApiRequest(query: string, variables: any = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    toast.error("Payment required", {
      description: "Shopify API access requires an active billing plan.",
    });
    return;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`Shopify error: ${data.errors.map((e: any) => e.message).join(', ')}`);
  }
  return data;
}

// ── Cart GraphQL ──

const CART_QUERY = `
  query cart($id: ID!) {
    cart(id: $id) { id totalQuantity }
  }
`;

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

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id }
      userErrors { field message }
    }
  }
`;

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('channel', 'online_store');
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(userErrors: Array<{ field: string[] | null; message: string }>): boolean {
  return userErrors.some(e => e.message.toLowerCase().includes('cart not found') || e.message.toLowerCase().includes('does not exist'));
}

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

export async function createShopifyCart(item: CartItem): Promise<{ cartId: string; checkoutUrl: string; lineId: string } | null> {
  // Route through our edge function to avoid browser CORS / network blocks
  // and to keep the request reliable from any origin.
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("shopify-create-checkout", {
      body: {
        lines: [{ merchandiseId: item.variantId, quantity: item.quantity }],
      },
    });

    if (error) {
      console.error("shopify-create-checkout invoke error:", error);
      return null;
    }

    if (!data?.checkoutUrl) {
      console.error("shopify-create-checkout returned no checkoutUrl:", data);
      return null;
    }

    // Both API-created and fallback cart URLs are valid Shopify checkout entry points.
    if (data.fallback) {
      console.info("Shopify direct-cart URL in use:", data.error);
    }

    return {
      cartId: data.cartId ?? "",
      checkoutUrl: data.checkoutUrl,
      lineId: data.lineId ?? "",
    };
  } catch (err) {
    console.error("createShopifyCart failed:", err);
    return null;
  }
}

export async function addLineToShopifyCart(cartId: string, item: CartItem): Promise<{ success: boolean; lineId?: string; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, { cartId, lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] });
  const userErrors = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) return { success: false };
  const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
  const newLine = lines.find((l: any) => l.node.merchandise.id === item.variantId);
  return { success: true, lineId: newLine?.node?.id };
}

export async function updateShopifyCartLine(cartId: string, lineId: string, quantity: number): Promise<{ success: boolean; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, { cartId, lines: [{ id: lineId, quantity }] });
  const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) return { success: false };
  return { success: true };
}

export async function removeLineFromShopifyCart(cartId: string, lineId: string): Promise<{ success: boolean; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, { cartId, lineIds: [lineId] });
  const userErrors = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) return { success: false };
  return { success: true };
}

export async function syncShopifyCart(cartId: string): Promise<boolean> {
  const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
  if (!data) return true; // preserve on error
  const cart = data?.data?.cart;
  return !!(cart && cart.totalQuantity > 0);
}

// Variant IDs for our products (GraphQL format). Each book format has a
// standard variant and a coloring-book-add-on variant (+$3) so the add-on is
// actually billed at checkout.
export const SHOPIFY_VARIANT_IDS = {
  bookSoftcover8x8: { standard: "gid://shopify/ProductVariant/53047693738208", coloring: "gid://shopify/ProductVariant/53047693770976" },
  bookHardcover8x8: { standard: "gid://shopify/ProductVariant/53047693803744", coloring: "gid://shopify/ProductVariant/53047693836512" },
  bookHardcover11x85: { standard: "gid://shopify/ProductVariant/53047693869280", coloring: "gid://shopify/ProductVariant/53047693902048" },
  bookBoardBook6x6: { standard: "gid://shopify/ProductVariant/53047693967584", coloring: "gid://shopify/ProductVariant/53047694000352" },
  // Standalone Coloring Book ($12) — its own product (no "+coloring" sub-variant).
  coloringBook: { standard: "gid://shopify/ProductVariant/53221487444192", coloring: "gid://shopify/ProductVariant/53221487444192" },
} as const;

// Subscription variants: one per plan x book type x coloring add-on, so each of
// the 18 combinations bills at its own recurring price (price = plan base +
// format delta x books/period + $3 coloring x books/period). These live on the
// three "Torah Tale ... Subscription" products as Book Type / Coloring Book
// option combinations.
export const SUBSCRIPTION_VARIANT_IDS: Record<
  "weekly" | "monthly" | "yearly",
  Record<"softcover" | "hardcover" | "board" | "coloring", { standard: string; coloring: string }>
> = {
  weekly: {
    softcover: { standard: "gid://shopify/ProductVariant/53047694033120", coloring: "gid://shopify/ProductVariant/53047694065888" },
    hardcover: { standard: "gid://shopify/ProductVariant/53047694098656", coloring: "gid://shopify/ProductVariant/53047694131424" },
    board: { standard: "gid://shopify/ProductVariant/53047694164192", coloring: "gid://shopify/ProductVariant/53047694196960" },
    // Standalone coloring-book subscription product (one variant per cadence, no add-on).
    coloring: { standard: "gid://shopify/ProductVariant/53229823492320", coloring: "gid://shopify/ProductVariant/53229823492320" },
  },
  monthly: {
    softcover: { standard: "gid://shopify/ProductVariant/53047694262496", coloring: "gid://shopify/ProductVariant/53047694295264" },
    hardcover: { standard: "gid://shopify/ProductVariant/53047694328032", coloring: "gid://shopify/ProductVariant/53047694360800" },
    board: { standard: "gid://shopify/ProductVariant/53047694393568", coloring: "gid://shopify/ProductVariant/53047694426336" },
    coloring: { standard: "gid://shopify/ProductVariant/53229823525088", coloring: "gid://shopify/ProductVariant/53229823525088" },
  },
  yearly: {
    softcover: { standard: "gid://shopify/ProductVariant/53047694459104", coloring: "gid://shopify/ProductVariant/53047694491872" },
    hardcover: { standard: "gid://shopify/ProductVariant/53047694524640", coloring: "gid://shopify/ProductVariant/53047694557408" },
    board: { standard: "gid://shopify/ProductVariant/53047694590176", coloring: "gid://shopify/ProductVariant/53047694622944" },
    coloring: { standard: "gid://shopify/ProductVariant/53229823557856", coloring: "gid://shopify/ProductVariant/53229823557856" },
  },
};

// Selling-plan IDs that turn a subscription variant into a recurring charge.
// These come from the Shopify Subscriptions app once selling plans are configured
// on the subscription products. Fill these in (gid://shopify/SellingPlan/...) before
// recurring billing will work — until then, subscription checkouts fall back to a
// one-off charge of the subscription variant.
export const SHOPIFY_SELLING_PLAN_IDS: Record<"weekly" | "monthly" | "yearly", string | null> = {
  weekly: "gid://shopify/SellingPlan/11163369696",
  monthly: "gid://shopify/SellingPlan/11163402464",
  yearly: "gid://shopify/SellingPlan/11163435232",
};

export type OrderPlan = "once" | "weekly" | "monthly" | "yearly";

interface OrderBookOptions {
  productType: "softcover" | "hardcover" | "board" | "coloring";
  // Hardcover is offered in 8×8 only (the 11×8.5 size was retired).
  hardcoverSize?: "8x8";
  coloringBook?: boolean;
}

export function getBookVariantId(options: OrderBookOptions): string {
  const pair =
    options.productType === "coloring"
      ? SHOPIFY_VARIANT_IDS.coloringBook
      : options.productType === "hardcover"
      ? SHOPIFY_VARIANT_IDS.bookHardcover8x8
      : options.productType === "board"
      ? SHOPIFY_VARIANT_IDS.bookBoardBook6x6
      : SHOPIFY_VARIANT_IDS.bookSoftcover8x8;
  // A standalone coloring book has no separate "+coloring" add-on.
  return options.coloringBook && options.productType !== "coloring" ? pair.coloring : pair.standard;
}

interface OrderLine {
  merchandiseId: string;
  quantity: number;
  sellingPlanId?: string;
}

function buildOrderLines(plan: OrderPlan, options: OrderBookOptions, quantity: number): OrderLine[] {
  if (plan === "once") {
    return [{ merchandiseId: getBookVariantId(options), quantity: Math.max(1, quantity) }];
  }
  const byFormat = SUBSCRIPTION_VARIANT_IDS[plan][options.productType];
  const subVariant = options.coloringBook ? byFormat.coloring : byFormat.standard;
  const sellingPlanId = SHOPIFY_SELLING_PLAN_IDS[plan] ?? undefined;
  return [{ merchandiseId: subVariant, quantity: 1, sellingPlanId }];
}

/**
 * Create a real Shopify checkout for a single order and return its hosted checkout URL.
 * The bookId is attached as a cart attribute so the orders/paid webhook can mark the
 * right book as paid. Returns null on failure (caller should surface an error).
 */
export async function createOrderCheckout(params: {
  bookId: string;
  plan: OrderPlan;
  bookOptions: OrderBookOptions;
  quantity: number;
}): Promise<{ checkoutUrl: string } | null> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const lines = buildOrderLines(params.plan, params.bookOptions, params.quantity);
    const { data, error } = await supabase.functions.invoke("shopify-create-checkout", {
      body: {
        lines,
        attributes: [{ key: "book_id", value: params.bookId }],
      },
    });
    if (error) {
      console.error("createOrderCheckout invoke error:", error);
      return null;
    }
    if (!data?.checkoutUrl) {
      console.error("createOrderCheckout returned no checkoutUrl:", data);
      return null;
    }
    return { checkoutUrl: data.checkoutUrl as string };
  } catch (err) {
    console.error("createOrderCheckout failed:", err);
    return null;
  }
}
