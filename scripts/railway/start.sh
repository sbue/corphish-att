#!/usr/bin/env bash

set -euo pipefail

if command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  corepack enable
  PNPM_CMD=(pnpm)
else
  PNPM_CMD=(npx -y pnpm@10.20.0)
fi

# Railway deploys this script for production runtime; default to prod Infisical env unless overridden.
export INFISICAL_ENV="${INFISICAL_ENV:-prod}"
export INFISICAL_SECRET_PATH="${INFISICAL_SECRET_PATH:-/}"

if [[ -z "${INFISICAL_TOKEN:-}" ]]; then
  echo '[railway][error] INFISICAL_TOKEN is required to fetch runtime secrets.' >&2
  exit 1
fi

if [[ -z "${INFISICAL_PROJECT_ID:-}" && ! -f ".infisical.json" ]]; then
  echo '[railway][error] INFISICAL_PROJECT_ID is required when .infisical.json is absent.' >&2
  exit 1
fi

SOURCE_STATIC_DIR='apps/web/.next/static'
TARGET_STATIC_DIR='apps/web/.next/standalone/apps/web/.next/static'

# Next standalone output does not include browser chunks by default.
# Keep static assets colocated with standalone server to avoid 404s.
if [[ -d "$SOURCE_STATIC_DIR" ]]; then
  mkdir -p "$TARGET_STATIC_DIR"
  rm -rf "$TARGET_STATIC_DIR/chunks" "$TARGET_STATIC_DIR/css" "$TARGET_STATIC_DIR/media"
  cp -R "$SOURCE_STATIC_DIR"/. "$TARGET_STATIC_DIR"/
fi

bash ./scripts/with-infisical.sh "${PNPM_CMD[@]}" --filter @corphish/db run migrate:db
bash ./scripts/with-infisical.sh node apps/web/.next/standalone/apps/web/server.js
