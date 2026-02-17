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

"${PNPM_CMD[@]}" install --frozen-lockfile
"${PNPM_CMD[@]}" --filter @corphish/web build
