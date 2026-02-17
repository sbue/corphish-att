#!/usr/bin/env bash

set -euo pipefail

bash ./scripts/with-infisical.sh bash -lc '
if command -v corepack >/dev/null 2>&1; then
  corepack enable
fi

pnpm install --frozen-lockfile
pnpm --filter @corphish/web build
'
