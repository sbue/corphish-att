#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/with-infisical.sh <command> [args...]

Behavior:
  - Uses Infisical when auth/project context is present.
  - Falls back to running the command directly when context is missing.
EOF
}

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

USE_INFISICAL='false'

if [[ -n "${INFISICAL_TOKEN:-}" || -f ".infisical.json" || -n "${INFISICAL_PROJECT_ID:-}" ]]; then
  USE_INFISICAL='true'
fi

if [[ "$USE_INFISICAL" != 'true' ]]; then
  exec "$@"
fi

INFISICAL_ENV="${INFISICAL_ENV:-dev}"
INFISICAL_SECRET_PATH="${INFISICAL_SECRET_PATH:-/}"

if command -v infisical >/dev/null 2>&1; then
  INFISICAL_CMD=(infisical)
else
  INFISICAL_CMD=(npx -y @infisical/cli)
fi

if [[ -n "${INFISICAL_TOKEN:-}" && -z "${INFISICAL_PROJECT_ID:-}" && ! -f ".infisical.json" ]]; then
  echo "INFISICAL_PROJECT_ID is required when using INFISICAL_TOKEN without .infisical.json." >&2
  echo "Set INFISICAL_PROJECT_ID or run 'npx @infisical/cli init' to generate .infisical.json." >&2
  exit 1
fi

INFISICAL_ARGS=(
  run
  --env "$INFISICAL_ENV"
  --path "$INFISICAL_SECRET_PATH"
)

if [[ -n "${INFISICAL_TOKEN:-}" ]]; then
  INFISICAL_ARGS+=(--token "$INFISICAL_TOKEN")
fi

if [[ -n "${INFISICAL_PROJECT_ID:-}" ]]; then
  INFISICAL_ARGS+=(--projectId "$INFISICAL_PROJECT_ID")
fi

exec "${INFISICAL_CMD[@]}" "${INFISICAL_ARGS[@]}" -- "$@"
