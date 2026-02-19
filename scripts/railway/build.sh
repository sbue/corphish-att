#!/usr/bin/env bash

set -euo pipefail

export INFISICAL_ENV="${INFISICAL_ENV:-prod}"
export INFISICAL_SECRET_PATH="${INFISICAL_SECRET_PATH:-/}"

if [[ -z "${INFISICAL_TOKEN:-}" ]]; then
  echo '[railway][error] INFISICAL_TOKEN is required to fetch deploy secrets.' >&2
  exit 1
fi

if [[ -z "${INFISICAL_PROJECT_ID:-}" && ! -f ".infisical.json" ]]; then
  echo '[railway][error] INFISICAL_PROJECT_ID is required when .infisical.json is absent.' >&2
  exit 1
fi

bash ./scripts/with-infisical.sh bash ./scripts/railway/build-inner.sh
