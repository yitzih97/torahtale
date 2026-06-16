#!/usr/bin/env bash
# Apply any not-yet-applied Supabase migrations to $PROJECT_REF using only a
# personal access token (Management API), so CI needs no DB password.
#
# Mirrors what `supabase db push` does: applies migration files whose 14-digit
# version is absent from supabase_migrations.schema_migrations, in order,
# recording each version. Stops on the first failure.
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${PROJECT_REF:?PROJECT_REF is required}"

API="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"
MIG_DIR="supabase/migrations"

# Run a SQL string via the Management API. Fails the script on a query error.
run_sql() {
  local sql="$1" label="$2" resp
  resp=$(jq -n --arg q "$sql" '{query: $q}' \
    | curl -s -X POST "$API" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        --data @-)
  if jq -e 'type == "object" and has("message")' >/dev/null 2>&1 <<<"$resp"; then
    echo "::error::Migration step failed ($label): $(jq -r '.message' <<<"$resp")"
    exit 1
  fi
}

# Ensure the tracking table exists.
run_sql "create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key, statements text[], name text);" "ensure-tracking-table"

# Fetch already-applied versions into a lookup set.
applied=$(jq -n '{query: "select version from supabase_migrations.schema_migrations"}' \
  | curl -s -X POST "$API" \
      -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
      -H "Content-Type: application/json" --data @- \
  | jq -r '.[]?.version' || true)

is_applied() { grep -qxF "$1" <<<"$applied"; }

shopt -s nullglob
for f in $(ls -1 "$MIG_DIR"/*.sql | sort); do
  base=$(basename "$f")
  version=$(grep -oE '^[0-9]{14}' <<<"$base" || true)
  [ -z "$version" ] && { echo "skip (no version prefix): $base"; continue; }
  if is_applied "$version"; then
    echo "already applied: $version"
    continue
  fi
  echo "applying: $base"
  run_sql "$(cat "$f")" "$base"
  # Record the version so it isn't re-applied next run.
  name="${base#*_}"; name="${name%.sql}"
  run_sql "insert into supabase_migrations.schema_migrations (version, name)
           values ('${version}', '$(sed "s/'/''/g" <<<"$name")')
           on conflict (version) do nothing;" "record-${version}"
  echo "applied + recorded: $version"
done
echo "Migrations up to date."
