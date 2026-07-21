#!/usr/bin/env bash
# Push the branded auth email templates in supabase/templates/ to the live
# project's auth config via the Management API (token-only, like
# apply-migrations.sh — no dashboard clicking, no DB password).
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${PROJECT_REF:?PROJECT_REF is required}"

API="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"

resp=$(jq -n \
  --arg confirmation "$(cat supabase/templates/confirmation.html)" \
  '{
    mailer_subjects_confirmation: "Confirm your email — TorahTale",
    mailer_templates_confirmation_content: $confirmation
  }' \
  | curl -s -X PATCH "$API" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      --data @-)

# The API echoes the full auth config on success; an error comes back as
# {"message": ...} without the template field.
if ! jq -e 'has("mailer_subjects_confirmation")' >/dev/null 2>&1 <<<"$resp"; then
  echo "::error::Failed to push auth email templates: $(jq -r '.message // .' <<<"$resp")"
  exit 1
fi
echo "Auth email templates pushed to ${PROJECT_REF}."
