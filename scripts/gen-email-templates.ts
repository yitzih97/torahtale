// Regenerates the static email template files from the single source in
// supabase/functions/_shared/emails.ts. Run: deno run --allow-write scripts/gen-email-templates.ts
//
// - confirmation.html / recovery.html are the Supabase Auth templates (keep the
//   Go-template {{ .ConfirmationURL }} token) pushed by push-auth-email-templates.sh.
// - book-delivered.html / book-shipped.html are design mirrors for reference
//   (the live sends are rendered in-code by printify-webhook).
import {
  renderConfirmationEmail,
  renderRecoveryEmail,
  renderDeliveredEmail,
  renderShippedEmail,
} from "../supabase/functions/_shared/emails.ts";

const files: Record<string, string> = {
  "supabase/templates/confirmation.html": renderConfirmationEmail(),
  "supabase/templates/recovery.html": renderRecoveryEmail(),
  "supabase/templates/book-delivered.html": renderDeliveredEmail({
    childName: "{{childName}}",
    firstName: "{{firstName}}",
    parsha: "{{parsha}}",
  }),
  "supabase/templates/book-shipped.html": renderShippedEmail({
    childName: "{{childName}}",
    firstName: "{{firstName}}",
    parsha: "{{parsha}}",
    trackingUrl: "https://tracking.example.com/{{trackingNumber}}",
  }),
};

for (const [path, html] of Object.entries(files)) {
  await Deno.writeTextFile(path, html + "\n");
  console.log("wrote", path);
}
