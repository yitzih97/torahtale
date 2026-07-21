#!/usr/bin/env bash
# Point Supabase auth emails at Resend SMTP so they come from @torahtale.com
# instead of noreply@mail.app.supabase.io. Runs in deploy-supabase.yml; no-ops
# with a warning until the RESEND_API_KEY repo secret is set. Requires the
# torahtale.com domain to be verified in Resend (SPF/DKIM at GoDaddy) first.
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${PROJECT_REF:?PROJECT_REF is required}"

if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "::warning::RESEND_API_KEY repo secret not set — auth emails keep the default Supabase sender."
  exit 0
fi

API="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"

resp=$(jq -n --arg pass "$RESEND_API_KEY" \
  '{
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: $pass,
    smtp_admin_email: "noreply@torahtale.com",
    smtp_sender_name: "TorahTale",
    smtp_max_frequency: 1
  }' \
  | curl -s -X PATCH "$API" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      --data @-)

if ! jq -e '.smtp_host == "smtp.resend.com"' >/dev/null 2>&1 <<<"$resp"; then
  echo "::error::Failed to configure SMTP: $(jq -r '.message // .' <<<"$resp")"
  exit 1
fi
echo "Supabase auth SMTP now sends via Resend as TorahTale <noreply@torahtale.com>."
