/**
 * Shipping details stored on a book's `shipping_data`.
 *
 * The same JSON blob is written from three places, each with its own key names:
 *   • the creation wizard's ShippingForm  → fullName / street / city / state / zip
 *   • the Shopify order webhook           → firstName / lastName / address1 / province / countryCode
 *   • the admin order editor (this file)  → BOTH of the above, always
 *
 * `printify-submit` reads the Shopify-shaped keys (address1, provinceCode ||
 * province || state, countryCode || country), while the customer dashboard and
 * the admin order dialog read the wizard-shaped ones. Writing every alias keeps
 * both readers correct no matter which path created the row - which is why an
 * admin address edit must go through `writeOrderAddress` rather than patching a
 * single key.
 */

export interface OrderAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  /** State / province - 2-letter code where the country has them (Printify wants the code). */
  province: string;
  zip: string;
  /** 2-letter ISO country code (US, IL, GB…). */
  country: string;
}

export const EMPTY_ORDER_ADDRESS: OrderAddress = {
  firstName: "", lastName: "", email: "", phone: "",
  address1: "", address2: "", city: "", province: "", zip: "", country: "US",
};

/** Read whichever key shape a book's shipping_data happens to use. */
export function readOrderAddress(ship: any): OrderAddress {
  const s = ship || {};
  const full = String(s.fullName || s.name || "").trim();
  const [firstWord, ...restWords] = full.split(/\s+/).filter(Boolean);
  return {
    firstName: s.firstName || firstWord || "",
    lastName: s.lastName || restWords.join(" ") || "",
    email: s.email || "",
    phone: s.phone || "",
    address1: s.address1 || s.street || "",
    address2: s.address2 || s.apt || "",
    city: s.city || "",
    province: s.provinceCode || s.province || s.state || "",
    zip: s.zip || s.postalCode || "",
    country: s.countryCode || s.country || "US",
  };
}

/** Merge an edited address back into shipping_data, writing every key alias. */
export function writeOrderAddress(existing: any, a: OrderAddress): Record<string, any> {
  const fullName = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
  return {
    ...(existing || {}),
    firstName: a.firstName,
    lastName: a.lastName,
    fullName,
    name: fullName,
    email: a.email,
    phone: a.phone,
    address1: a.address1,
    street: a.address1,
    address2: a.address2,
    apt: a.address2,
    city: a.city,
    province: a.province,
    provinceCode: a.province,
    state: a.province,
    zip: a.zip,
    country: a.country,
    countryCode: a.country,
  };
}

/** One line of address text, for tables and summaries. */
export function formatAddressLine(ship: any): string {
  const a = readOrderAddress(ship);
  const cityLine = [a.city, a.province, a.zip].filter(Boolean).join(", ");
  return [a.address1, a.address2, cityLine, a.country].filter(Boolean).join(" · ");
}

/**
 * Shipping speed. The stored value stays wizard-compatible ("standard" /
 * "express"), and `printify-submit` maps it to Printify's numeric
 * shipping_method - keep the codes here in sync with the identical map in
 * supabase/functions/printify-submit/index.ts.
 */
export const SHIPPING_SPEEDS = [
  // Transit time depends on the zone (US 5-8 / 3 days, Israel 9-14 / 5-8), so
  // the admin picker names the service and leaves the days to SHIPPING_DAYS.
  { value: "standard", label: "Standard", sub: "Ground", code: 1 },
  { value: "express", label: "Express / Priority", sub: "Expedited", code: 2 },
  { value: "printify_express", label: "Printify Express", sub: "1-3 days, only where the provider offers it", code: 3 },
  { value: "economy", label: "Economy", sub: "cheapest, slowest", code: 4 },
] as const;

export type ShippingSpeed = (typeof SHIPPING_SPEEDS)[number]["value"];

/** The speed stored on a book, defaulting to standard. */
export function readShippingSpeed(ship: any): ShippingSpeed {
  const raw = String(ship?.shippingMethod ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const match = SHIPPING_SPEEDS.find((s) => s.value === raw);
  if (match) return match.value;
  // "priority" is Printify's own name for what the wizard sells as "express".
  if (raw === "priority") return "express";
  return "standard";
}

export function shippingSpeedLabel(ship: any): string {
  const v = readShippingSpeed(ship);
  return SHIPPING_SPEEDS.find((s) => s.value === v)?.label || "Standard";
}
