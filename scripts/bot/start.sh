#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'EOF'
Usage:
  pnpm bot:start -- --bot <bot-name> [--no-attach]

Options:
  --bot <name>    Canonical bot id used in bot:new
  --no-attach     Start/refresh tmux session without attaching
  --help          Show help
EOF
}

BOT_NAME=''
ATTACH='true'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --bot)
      BOT_NAME="${2:-}"
      shift 2
      ;;
    --no-attach)
      ATTACH='false'
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

[[ -n "$BOT_NAME" ]] || die 'Missing required --bot argument.'

require_cmd tmux

STATE_FILE="$(bot_state_file "$BOT_NAME")"
load_bot_state "$STATE_FILE"

[[ -d "$WORKTREE_PATH" ]] || die "Worktree path does not exist: $WORKTREE_PATH"

ensure_tmux_session "$TMUX_SESSION" "$WORKTREE_PATH"
set_tmux_bot_env \
  "$TMUX_SESSION" \
  BOT_NAME "$BOT_NAME" \
  BD_ACTOR "$BD_ACTOR" \
  ISSUE_ID "$ISSUE_ID" \
  PORT "$PORT" \
  NEXT_PUBLIC_APP_URL "$NEXT_PUBLIC_APP_URL" \
  DATABASE_URL "$DATABASE_URL"

log "Session ready: $TMUX_SESSION"
log "Worktree: $WORKTREE_PATH"

if [[ "$ATTACH" != 'true' ]]; then
  exit 0
fi

if [[ -n "${TMUX:-}" ]]; then
  tmux switch-client -t "$TMUX_SESSION"
else
  tmux attach-session -t "$TMUX_SESSION"
fi
