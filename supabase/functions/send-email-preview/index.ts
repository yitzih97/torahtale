// Throwaway helper: sends one of each transactional email design to a fixed
// address so we can eyeball them in a real inbox. Recipient is hardcoded (not
// caller-controlled) so this can't be abused as a spam relay. Remove once the
// designs are approved.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  renderDeliveredEmail,
  renderShippedEmail,
  renderConfirmationEmail,
  renderRecoveryEmail,
  sendResendEmail,
} from "../_shared/emails.ts";

const TO = "yitzih97@gmail.com";
// parsha value for the "arrived" sample, a special (non-parsha) book for the
// "shipped" sample, so both phrasings show: "Parsha Noach" / "the Book of Purim".
const arrived = { childName: "Miriam", firstName: "Sara", parsha: "noach" };
const shipped = { childName: "Miriam", firstName: "Sara", parsha: "purim" };
const trackingUrl = "https://easyordertracking.aftership.com/9400111899223197428490";

serve(async () => {
  const jobs: Array<{ subject: string; html: string }> = [
    { subject: "Your Book Has Arrived! - Torah Tale", html: renderDeliveredEmail(arrived) },
    { subject: "Your Book Has Shipped! - Torah Tale", html: renderShippedEmail({ ...shipped, trackingUrl }) },
    { subject: "Confirm your email - Torah Tale", html: renderConfirmationEmail("https://torahtale.com/auth/confirm?token=sample") },
    { subject: "Reset your password - Torah Tale", html: renderRecoveryEmail("https://torahtale.com/reset-password?token=sample") },
  ];
  const results: Record<string, boolean> = {};
  for (const j of jobs) {
    results[j.subject] = await sendResendEmail({ to: TO, subject: `[PREVIEW] ${j.subject}`, html: j.html });
  }
  return new Response(JSON.stringify({ to: TO, results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
