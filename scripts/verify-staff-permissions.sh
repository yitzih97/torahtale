#!/usr/bin/env bash
# Proves what the staff login can and cannot reach, against the live project.
# Read-only: it signs in, reads, and inspects policy definitions. It never
# writes, and it never prints a token or a password.
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

echo "What the staff session can read:"
BOOKS=$(rows books)
[ "$BOOKS" -gt 0 ] && echo "  PASS  books are readable ($BOOKS sampled)" || { echo "  FAIL  books are NOT readable"; fails=$((fails+1)); }
check "profiles are hidden"      0 "$(rows profiles)"
check "children are hidden"      0 "$(rows children)"
check "subscriptions are hidden" 0 "$(rows subscriptions)"
check "site_settings are hidden" 0 "$(rows site_settings)"
check "contact_tickets are hidden" 0 "$(rows contact_tickets)"

sql() { jq -n --arg q "$1" '{query: $q}' | curl -s -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Content-Type: application/json" --data @-; }

echo "What no policy grants:"
DELPOL=$(sql "select count(*) as n from pg_policies where schemaname='public' and tablename='books' and cmd='DELETE' and qual like '%staff%'" | jq -r '.[0].n')
check "no DELETE policy on books for staff" 0 "$DELPOL"
INSPOL=$(sql "select count(*) as n from pg_policies where schemaname='public' and tablename='books' and cmd='INSERT' and with_check like '%staff%'" | jq -r '.[0].n')
check "no INSERT policy on books for staff" 0 "$INSPOL"
OTHER=$(sql "select count(*) as n from pg_policies where schemaname='public'
             and tablename in ('profiles','children','subscriptions','site_settings','contact_tickets')
             and (qual like '%staff%' or with_check like '%staff%')" | jq -r '.[0].n')
check "no staff policy on customer tables" 0 "$OTHER"
GUARD=$(sql "select count(*) as n from pg_proc where proname='guard_book_privileged_fields' and prosrc like '%staff%'" | jq -r '.[0].n')
check "payment fields are frozen for staff" 1 "$GUARD"

[ "$fails" -eq 0 ] || { echo "::error::${fails} permission check(s) failed"; exit 1; }
echo "All staff permission checks passed."
