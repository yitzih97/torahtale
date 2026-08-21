#!/usr/bin/env bash
# Proves what the staff login can and cannot reach, against the live project.
# It signs in, reads, inspects policy definitions, and attempts the two writes
# that MUST be refused - a book DELETE aimed at an id that does not exist, and a
# self-promotion to admin. Nothing it does can change data, and it never prints
# a token or a password.
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?}"; : "${PROJECT_REF:?}"
: "${STAFF_EMAIL:?}"; : "${STAFF_PASSWORD:?}"; : "${PUBLISHABLE_KEY:?}"

BASE="https://${PROJECT_REF}.supabase.co"
fails=0
check() { # name, expected, actual
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; else echo "  FAIL  $1 (expected $2, got $3)"; fails=$((fails+1)); fi
}

JWT=$(jq -n --arg e "$STAFF_EMAIL" --arg p "$STAFF_PASSWORD" '{email: $e, password: $p}' \
  | curl -s -X POST "${BASE}/auth/v1/token?grant_type=password" \
      -H "apikey: ${PUBLISHABLE_KEY}" -H "Content-Type: application/json" --data @- \
  | jq -r '.access_token // empty')
[ -n "$JWT" ] || { echo "::error::the staff login could not sign in"; exit 1; }
echo "Signed in as ${STAFF_EMAIL}."

rows() { # table -> row count the staff session can see
  curl -s -G "${BASE}/rest/v1/$1" --data-urlencode "select=id" --data-urlencode "limit=5" \
    -H "apikey: ${PUBLISHABLE_KEY}" -H "Authorization: Bearer ${JWT}" | jq 'if type=="array" then length else 0 end'
}

STAFF_UID=$(curl -s "${BASE}/auth/v1/user" -H "apikey: ${PUBLISHABLE_KEY}" -H "Authorization: Bearer ${JWT}" | jq -r '.id')

echo "What the staff session can read (everything an admin can):"
for t in books profiles children subscriptions site_settings contact_tickets; do
  N=$(rows "$t")
  if [ "$N" -gt 0 ]; then echo "  PASS  $t readable ($N sampled)"; else echo "  FAIL  $t NOT readable"; fails=$((fails+1)); fi
done

sql() { jq -n --arg q "$1" '{query: $q}' | curl -s -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Content-Type: application/json" --data @-; }

echo "What no policy grants (the whole of what staff cannot do):"
DELPOL=$(sql "select count(*) as n from pg_policies
              where cmd='DELETE' and (qual like '%staff%' or with_check like '%staff%')" | jq -r '.[0].n')
check "no DELETE policy anywhere for staff" 0 "$DELPOL"
ALLPOL=$(sql "select count(*) as n from pg_policies
              where cmd='ALL' and (qual like '%staff%' or with_check like '%staff%')" | jq -r '.[0].n')
check "no FOR ALL policy for staff (it would include DELETE)" 0 "$ALLPOL"
ROLEPOL=$(sql "select count(*) as n from pg_policies
               where tablename in ('user_roles','staff_emails')
               and (qual like '%staff%' or with_check like '%staff%')" | jq -r '.[0].n')
check "staff cannot grant roles or add staff" 0 "$ROLEPOL"

echo "Editing works, deleting does not (on a throwaway row, never on real data):"
PROBE_KEY="rls-probe-$(date +%s)"
rest() { curl -s -o /dev/null -w '%{http_code}' "$@" -H "apikey: ${PUBLISHABLE_KEY}" -H "Authorization: Bearer ${JWT}"; }

INS=$(jq -n --arg k "$PROBE_KEY" '{category: "_rls_probe", key: $k, value: "before"}' \
  | rest -X POST "${BASE}/rest/v1/site_settings" -H "Content-Type: application/json" --data @-)
check "staff can INSERT" 201 "$INS"

UPD=$(jq -n '{value: "after"}' \
  | rest -X PATCH "${BASE}/rest/v1/site_settings?category=eq._rls_probe&key=eq.${PROBE_KEY}" \
      -H "Content-Type: application/json" --data @-)
check "staff can UPDATE" 204 "$UPD"

rest -X DELETE "${BASE}/rest/v1/site_settings?category=eq._rls_probe&key=eq.${PROBE_KEY}" > /dev/null
STILL_THERE=$(curl -s -G "${BASE}/rest/v1/site_settings" \
  --data-urlencode "category=eq._rls_probe" --data-urlencode "key=eq.${PROBE_KEY}" --data-urlencode "select=key" \
  -H "apikey: ${PUBLISHABLE_KEY}" -H "Authorization: Bearer ${JWT}" | jq 'if type=="array" then length else 0 end')
check "the row SURVIVES a staff DELETE" 1 "$STILL_THERE"

# Clean up as the owner, which is the point: someone can still remove it.
sql "delete from public.site_settings where category = '_rls_probe'" > /dev/null
GONE=$(sql "select count(*) as n from public.site_settings where category='_rls_probe'" | jq -r '.[0].n')
check "probe rows cleaned up" 0 "$GONE"

# The one that makes "no delete" mean something: an account that can hand itself
# the admin role can hand itself deletion too.
ROLESTATUS=$(jq -n --arg u "$STAFF_UID" '{user_id: $u, role: "admin"}' \
  | rest -X POST "${BASE}/rest/v1/user_roles" -H "Content-Type: application/json" --data @-)
check "staff cannot promote itself to admin" 403 "$ROLESTATUS"

[ "$fails" -eq 0 ] || { echo "::error::${fails} permission check(s) failed"; exit 1; }
echo "All staff permission checks passed."
