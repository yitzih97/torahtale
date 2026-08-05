// Transactional emails sent by our own edge functions via the Resend API.
//
// Auth emails (confirm / password reset) are rendered by Supabase from the
// templates in supabase/templates/*.html — this module is only for emails we
// trigger ourselves, currently the "Your Book Has Arrived!" delivery notice
// fired from printify-webhook when Printify reports an order delivered.
//
// The HTML below is kept in sync with supabase/templates/book-delivered.html
// (the design source also pasted into the Resend "your-book-has-arrived"
// template). Tokens {{greeting}}, {{childName}} and {{parsha}} are filled here.

const DELIVERED_HTML = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" lang="en"><head><meta content="width=device-width" name="viewport"/><meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/><meta name="x-apple-disable-message-reformatting"/><meta content="IE=edge" http-equiv="X-UA-Compatible"/><meta name="x-apple-disable-message-reformatting"/><meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection"/><title>Your book has arrived</title><style>@media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}</style></head><body dir="ltr" lang="en" style="background-color:#fbf3e3;margin:0;padding:0"><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">{{childName}}&#x27;s Torah Tale has been delivered — mazel tov!</div><table border="0" width="100%" cellPadding="0" cellSpacing="0" role="presentation" align="center"><tbody><tr><td dir="ltr" lang="en" style="margin:0;padding:0;background-color:#fbf3e3"><table align="left" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;align:left;width:100%;color:#000000;background-color:#ffffff;border-radius:0px;border-color:#000000"><tbody><tr style="width:100%"><td style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px"><table width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:40px;padding-right:0;padding-bottom:40px;padding-left:0;background-color:#FBF3E3"><tbody><tr style="margin:0;padding:0"><td align="center" data-id="__react-email-column" style="margin:0;padding:0"><table width="600" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background-color:#FFFFFF;border-radius:12px;overflow:hidden;max-width:600px;width:100%"><tbody><tr style="margin:0;padding:0"><td align="center" data-id="__react-email-column" style="margin:0;padding:36px 24px 24px 24px"><img alt="A golden open book logo with the words &quot;Torah Tale&quot; below it." height="141" src="https://cdn.resend.app/7ce3b2b7-42db-4515-8adc-2d816c3b438d" style="display:block;outline:none;border:none;text-decoration:none" width="141"/></td></tr><tr style="margin:0;padding:0"><td data-id="__react-email-column" style="margin:0;padding:8px 40px 24px 40px"><h1 style="margin:0 0 16px 0;padding:0;font-family:Georgia, &#x27;Times New Roman&#x27;, serif;font-size:24px;color:#1F2A44;text-align:center">Your book has arrived!</h1><p style="margin:0 0 20px 0;padding:0;font-size:16px;line-height:26px;color:#4A4032;text-align:center;font-weight:bold">{{greeting}}</p><p style="margin:0 0 16px 0;padding:0;font-size:16px;line-height:26px;color:#4A4032;text-align:center">{{childName}}&#x27;s very own Torah Tale for Parashas {{parsha}} has just been delivered to your door.</p><p style="margin:0;padding:0;font-size:16px;line-height:26px;color:#4A4032;text-align:center">Curl up together, turn to page one, and watch {{childName}}&#x27;s eyes light up at seeing themselves inside a timeless Torah story. This is the moment we made it for.</p></td></tr><tr style="margin:0;padding:0"><td align="center" data-id="__react-email-column" style="margin:0;padding:0 40px 32px 40px"><p style="margin:0;padding:0"><a href="https://torahtale.com/dashboard" rel="noopener noreferrer nofollow" style="color:#0670DB;text-decoration-line:none;text-decoration:underline" target="_blank"><span style="display:inline-block;background-color:#C9972C;color:#FFFFFF;font-family:Georgia, &#x27;Times New Roman&#x27;, serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:8px">View your library</span></a></p></td></tr><tr style="margin:0;padding:0"><td data-id="__react-email-column" style="margin:0;padding:0 40px 32px 40px"><p style="margin:0;padding:0;font-size:13px;line-height:20px;color:#8A8171;text-align:center">Loved it? Just reply with a photo of {{childName}} enjoying their book — we treasure every one. Ready for the next parsha? Your library is always open, and any questions about your order are welcome here too.</p></td></tr></tbody></table></td></tr></tbody></table><table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" class="node-footer"><tbody><tr><td align="center" style="padding:16px 40px 0 40px"><p style="margin:0;padding:0;font-size:13px;line-height:20px;color:#8A8171;text-align:center">Torah Tale · Bringing Torah stories to life</p><hr class="divider" style="width:100%;border:none;border-color:transparent;border-top:1px solid #eaeaea;margin:16px 0"/><p style="margin:0;padding:0;font-size:12px;line-height:18px;color:#b3ab99;text-align:center">You are receiving this email because you placed an order with Torah Tale.</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export interface DeliveredEmailInput {
  childName?: string | null;
  parsha?: string | null;
  firstName?: string | null;
}

export function renderDeliveredEmail(input: DeliveredEmailInput): string {
  const child = escapeHtml((input.childName || "Your child").trim());
  const parsha = escapeHtml((input.parsha || "this week").trim());
  const first = (input.firstName || "").trim();
  const greeting = first ? `Mazel tov, ${escapeHtml(first)}!` : "Mazel tov!";
  return DELIVERED_HTML
    .replaceAll("{{greeting}}", greeting)
    .replaceAll("{{childName}}", child)
    .replaceAll("{{parsha}}", parsha);
}

/**
 * Send a transactional email through the Resend API. Returns true on success.
 * Never throws — a failed delivery notice must not fail the webhook that
 * triggered it.
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
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
