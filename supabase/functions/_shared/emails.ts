// Single source of truth for TorahTale's transactional email designs.
//
// - renderDeliveredEmail / renderShippedEmail are sent by printify-webhook via
//   the Resend API when Printify reports an order shipped/delivered.
// - renderConfirmationEmail / renderRecoveryEmail produce the Supabase Auth
//   templates written to supabase/templates/*.html by scripts/gen-email-templates.ts.
//
// The "title section" of every email is the brand heading rendered in the
// TorahTale display font as a hosted PNG (torahtale.com/email/title-*.png) so
// the font shows in every client, including Gmail (which strips @font-face).

const LOGO_URL = "https://cdn.resend.app/7ce3b2b7-42db-4515-8adc-2d816c3b438d";
const TITLE_BASE = "https://torahtale.com/email";

const C = {
  page: "#FBF3E3",
  card: "#FFFFFF",
  navy: "#1F2A44",
  body: "#4A4032",
  gold: "#C9972C",
  muted: "#8A8171",
  faint: "#b3ab99",
};

// Title images and their display dimensions (rendered @2x for retina).
const TITLES = {
  delivered: { file: "title-delivered.png", alt: "Your book has arrived!", w: 327, h: 39 },
  shipped: { file: "title-shipped.png", alt: "Your book has shipped!", w: 336, h: 46 },
  confirm: { file: "title-confirm.png", alt: "Confirm your email", w: 283, h: 44 },
  reset: { file: "title-reset.png", alt: "Reset your password", w: 305, h: 45 },
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function greeting(text: string): string {
  return `<p style="margin:0 0 18px 0;padding:0;font-size:17px;line-height:26px;color:${C.body};text-align:center;font-weight:bold">${text}</p>`;
}
function para(html: string): string {
  return `<p style="margin:0 0 16px 0;padding:0;font-size:16px;line-height:26px;color:${C.body};text-align:center">${html}</p>`;
}
function button(label: string, href: string): string {
  return `<table role="presentation" border="0" cellPadding="0" cellSpacing="0" align="center" style="margin:8px auto 0 auto"><tbody><tr><td align="center" style="border-radius:8px;background-color:${C.gold}"><a href="${href}" rel="noopener noreferrer nofollow" target="_blank" style="display:inline-block;color:#FFFFFF;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:8px">${label}</a></td></tr></tbody></table>`;
}
function small(html: string): string {
  return `<p style="margin:0;padding:0;font-size:13px;line-height:20px;color:${C.muted};text-align:center">${html}</p>`;
}

interface LayoutOpts {
  preheader: string;
  title: { file: string; alt: string; w: number; h: number };
  body: string; // inner HTML (greeting/paras/button)
  closing?: string; // small print below the card body
  footerNote: string; // one-line reason-for-receiving
}

function layout(o: LayoutOpts): string {
  const t = o.title;
  const divider = `<table role="presentation" border="0" cellPadding="0" cellSpacing="0" align="center" style="margin:16px auto 22px auto"><tbody><tr><td style="width:56px;border-top:2px solid ${C.gold};font-size:0;line-height:0">&nbsp;</td></tr></tbody></table>`;
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" lang="en"><head><meta content="width=device-width" name="viewport"/><meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/><meta name="x-apple-disable-message-reformatting"/><meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection"/><title>${t.alt}</title></head><body dir="ltr" lang="en" style="background-color:${C.page};margin:0;padding:0"><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">${o.preheader}</div><table border="0" width="100%" cellPadding="0" cellSpacing="0" role="presentation" align="center" style="background-color:${C.page}"><tbody><tr><td align="center" style="padding:40px 12px"><table width="600" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="background-color:${C.card};border-radius:14px;overflow:hidden;max-width:600px;width:100%;border:1px solid #efe6d0"><tbody><tr><td align="center" style="padding:40px 24px 8px 24px"><img alt="Torah Tale" height="132" width="132" src="${LOGO_URL}" style="display:block;outline:none;border:0;text-decoration:none"/></td></tr><tr><td align="center" style="padding:6px 32px 0 32px"><img alt="${t.alt}" width="${t.w}" height="${t.h}" src="${TITLE_BASE}/${t.file}" style="display:block;outline:none;border:0;text-decoration:none;max-width:100%;height:auto;margin:0 auto"/></td></tr><tr><td align="center" style="padding:0 40px">${divider}</td></tr><tr><td style="padding:0 40px 8px 40px">${o.body}</td></tr>${o.closing ? `<tr><td style="padding:24px 40px 0 40px">${o.closing}</td></tr>` : ""}<tr><td style="padding:28px 40px 36px 40px"><hr style="width:100%;border:0;border-top:1px solid #eee6d4;margin:0 0 16px 0"/><p style="margin:0 0 6px 0;padding:0;font-size:13px;line-height:20px;color:${C.muted};text-align:center">Torah Tale &middot; Bringing Torah stories to life</p><p style="margin:0;padding:0;font-size:12px;line-height:18px;color:${C.faint};text-align:center">${o.footerNote}</p></td></tr></tbody></table></td></tr></tbody></table></body></html>`;
}

// ---------------------------------------------------------------------------
// Order emails (sent by printify-webhook via the Resend API)
// ---------------------------------------------------------------------------

interface OrderInput {
  childName?: string | null;
  parsha?: string | null;
  firstName?: string | null;
}

export function renderDeliveredEmail(input: OrderInput): string {
  const child = escapeHtml((input.childName || "Your child").trim());
  const parsha = escapeHtml((input.parsha || "this week").trim());
  const first = (input.firstName || "").trim();
  const hi = first ? `Great news, ${escapeHtml(first)}!` : "Great news!";
  const body =
    greeting(hi) +
    para(`${child}&#x27;s very own Torah Tale for Parashas ${parsha} has just been delivered to your door.`) +
    para(`Curl up together, turn to page one, and watch ${child}&#x27;s eyes light up at seeing themselves inside a timeless Torah story. This is the moment we made it for.`) +
    button("Write a review", "https://g.page/r/CdbQVA-n5_hAEAI/review");
  const closing = small(
    `Loved it? Please take a moment to leave a review — it helps other families discover TorahTale, and we read every one. You can also reply with a photo of ${child} enjoying their book, and any questions about your order are always welcome here too.`,
  );
  return layout({
    preheader: `${child}'s Torah Tale has been delivered!`,
    title: TITLES.delivered,
    body,
    closing,
    footerNote: "You are receiving this email because you placed an order with Torah Tale.",
  });
}

export function renderShippedEmail(input: OrderInput & { trackingUrl?: string | null }): string {
  const child = escapeHtml((input.childName || "Your child").trim());
  const parsha = escapeHtml((input.parsha || "this week").trim());
  const first = (input.firstName || "").trim();
  const hi = first ? `It&#x27;s on its way, ${escapeHtml(first)}!` : "It&#x27;s on its way!";
  const track = (input.trackingUrl || "").trim();
  const body =
    greeting(hi) +
    para(`${child}&#x27;s very own Torah Tale for Parashas ${parsha} has left our workshop and is heading to your door.`) +
    para(
      track
        ? `Follow its journey with the tracking link below — we can&#x27;t wait for ${child} to hold it.`
        : `We&#x27;ll send another note the moment it arrives — we can&#x27;t wait for ${child} to hold it.`,
    ) +
    (track ? button("Track your package", escapeHtml(track)) : "");
  const closing = small(
    `Questions about your order? Just reply — we&#x27;re always happy to help. We&#x27;ll email you again as soon as it&#x27;s delivered.`,
  );
  return layout({
    preheader: `${child}'s Torah Tale is on its way!`,
    title: TITLES.shipped,
    body,
    closing,
    footerNote: "You are receiving this email because you placed an order with Torah Tale.",
  });
}

// ---------------------------------------------------------------------------
// Auth emails (rendered by Supabase from supabase/templates/*.html)
// ---------------------------------------------------------------------------

export function renderConfirmationEmail(confirmUrl = "{{ .ConfirmationURL }}"): string {
  const body =
    greeting("Welcome to Torah Tale!") +
    para("We are so glad you are here. Please confirm your email address to unlock your account and begin exploring timeless stories from the Torah.") +
    button("Confirm Email", confirmUrl);
  const closing = small("This link will expire in 24 hours. If you did not create a Torah Tale account, you can safely ignore this email.");
  return layout({
    preheader: "Confirm your email to start your Torah Tale journey.",
    title: TITLES.confirm,
    body,
    closing,
    footerNote: "You are receiving this email because you signed up at torahtale.com.",
  });
}

export function renderRecoveryEmail(resetUrl = "{{ .ConfirmationURL }}"): string {
  const body =
    greeting("Forgot your password?") +
    para("We received a request to reset the password for your Torah Tale account. Click the button below to choose a new one.") +
    button("Reset Password", resetUrl);
  const closing = small("This link will expire in 24 hours. If you did not request a password reset, you can safely ignore this email.");
  return layout({
    preheader: "Reset your password for your Torah Tale account.",
    title: TITLES.reset,
    body,
    closing,
    footerNote: "You are receiving this email because a password reset was requested for your Torah Tale account.",
  });
}

// ---------------------------------------------------------------------------
// Resend transport
// ---------------------------------------------------------------------------

/**
 * Send a transactional email through the Resend API. Returns true on success.
 * Never throws — a failed notification must not fail the webhook that triggered it.
 */
export async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("sendResendEmail: RESEND_API_KEY not configured — skipping send");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Torah Tale <help@torahtale.com>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo ?? "help@torahtale.com",
      }),
    });
    if (!res.ok) {
      console.error(`sendResendEmail: Resend returned ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendResendEmail: request failed:", e);
    return false;
  }
}
