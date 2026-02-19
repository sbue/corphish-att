#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/with-infisical.sh <command> [args...]

Behavior:
  - Uses Infisical when INFISICAL_ENABLED=true, or when set to auto and config exists.
  - Falls back to running the command directly when INFISICAL_ENABLED=false.
EOF
}

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

INFISICAL_MODE="$(echo "${INFISICAL_ENABLED:-auto}" | tr '[:upper:]' '[:lower:]')"
USE_INFISICAL='false'

case "$INFISICAL_MODE" in
  true|1|yes|y|on)
    USE_INFISICAL='true'
    ;;
  false|0|no|n|off)
    USE_INFISICAL='false'
    ;;
  auto|'')
    if [[ -n "${INFISICAL_TOKEN:-}" || -f ".infisical.json" ]]; then
      USE_INFISICAL='true'
    fi
    ;;
  *)
    echo "Invalid INFISICAL_ENABLED value: $INFISICAL_MODE" >&2
    echo "Expected true, false, or auto." >&2
    exit 1
    ;;
esac

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

if [[ -z "${INFISICAL_TOKEN:-}" && ! -f ".infisical.json" ]]; then
  echo "Infisical local auth context not found (INFISICAL_TOKEN/.infisical.json)." >&2
  echo "Attempting CLI session auth context." >&2
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
