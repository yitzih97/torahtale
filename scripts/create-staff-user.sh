#!/usr/bin/env bash
# Provision (or re-provision) an employee login using only a Supabase personal
# access token, the way scripts/apply-migrations.sh does - no DB password and no
# service-role key checked in anywhere.
#
#   STAFF_EMAIL     the login to create
#   STAFF_PASSWORD  its password, from a repository secret. Never echoed.
#
# The staff ROLE is not granted here: staff_emails + the grant_staff_role trigger
# attach it the moment the account exists (see the 20260821 migrations), so this
# script only has to make the account. It re-runs safely - an existing account
# has its password reset instead of erroring.
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${PROJECT_REF:?PROJECT_REF is required}"
: "${STAFF_EMAIL:?STAFF_EMAIL is required}"
: "${STAFF_PASSWORD:?STAFF_PASSWORD is required}"

API="https://api.supabase.com/v1/projects/${PROJECT_REF}"

# The service-role key is read at run time and never stored.
SERVICE_KEY=$(curl -s -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  "${API}/api-keys?reveal=true" | jq -r '.[] | select(.name == "service_role") | .api_key')
[ -n "$SERVICE_KEY" ] && [ "$SERVICE_KEY" != "null" ] || { echo "::error::Could not read the service_role key"; exit 1; }

AUTH="https://${PROJECT_REF}.supabase.co/auth/v1"

# Does the account already exist?
EXISTING_ID=$(curl -s -G "${AUTH}/admin/users" --data-urlencode "filter=${STAFF_EMAIL}" \
  -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
  | jq -r --arg e "$STAFF_EMAIL" '.users[]? | select((.email | ascii_downcase) == ($e | ascii_downcase)) | .id' | head -1)

if [ -n "$EXISTING_ID" ]; then
  echo "Account exists (${EXISTING_ID}) - resetting its password."
  RESP=$(jq -n --arg p "$STAFF_PASSWORD" '{password: $p, email_confirm: true}' \
    | curl -s -X PUT "${AUTH}/admin/users/${EXISTING_ID}" \
        -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "Content-Type: application/json" --data @-)
else
  # email_confirm: the mailbox may not exist, and an employee login should not
  # depend on a confirmation click.
  RESP=$(jq -n --arg e "$STAFF_EMAIL" --arg p "$STAFF_PASSWORD" \
      '{email: $e, password: $p, email_confirm: true}' \
    | curl -s -X POST "${AUTH}/admin/users" \
        -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "Content-Type: application/json" --data @-)
fi

USER_ID=$(jq -r '.id // empty' <<<"$RESP")
if [ -z "$USER_ID" ]; then
  echo "::error::Could not provision ${STAFF_EMAIL}: $(jq -r '.msg // .message // .error_description // "unknown error"' <<<"$RESP")"
  exit 1
fi

# Belt and braces: the signup trigger grants the role, but an account that
# existed BEFORE the staff_emails row was added never fired it.
jq -n --arg q "insert into public.user_roles (user_id, role)
       select u.id, 'staff'::public.app_role
       from auth.users u
       join public.staff_emails s on lower(s.email) = lower(u.email)
       on conflict (user_id, role) do nothing;" '{query: $q}' \
  | curl -s -X POST "${API}/database/query" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" --data @- > /dev/null

ROLES=$(jq -n --arg q "select r.role::text from public.user_roles r
                       join auth.users u on u.id = r.user_id
                       where lower(u.email) = lower('${STAFF_EMAIL}')" '{query: $q}' \
  | curl -s -X POST "${API}/database/query" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" --data @- | jq -r '[.[]?.role] | join(", ")')

echo "Provisioned ${STAFF_EMAIL} (${USER_ID}) with role(s): ${ROLES:-none}"
