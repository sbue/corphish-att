#!/usr/bin/env bash

set -euo pipefail

SOURCE_STATIC_DIR='apps/web/.next/static'
TARGET_STATIC_DIR='apps/web/.next/standalone/apps/web/.next/static'

# Next standalone output does not include browser chunks by default.
# Keep static assets colocated with standalone server to avoid 404s.
if [[ -d "$SOURCE_STATIC_DIR" ]]; then
  mkdir -p "$TARGET_STATIC_DIR"
  rm -rf "$TARGET_STATIC_DIR/chunks" "$TARGET_STATIC_DIR/css" "$TARGET_STATIC_DIR/media"
  cp -R "$SOURCE_STATIC_DIR"/. "$TARGET_STATIC_DIR"/
fi

bash ./scripts/with-infisical.sh node apps/web/.next/standalone/apps/web/server.js
