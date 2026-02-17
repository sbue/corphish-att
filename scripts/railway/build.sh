#!/usr/bin/env bash

set -euo pipefail

bash ./scripts/with-infisical.sh bash -lc 'corepack enable && pnpm install --frozen-lockfile && pnpm --filter @corphish/web build'
