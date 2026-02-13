#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'EOF'
Usage:
  pnpm bot:cleanup -- --bot <bot-name> [--force]

Options:
  --bot <name>    Canonical bot id used in bot:new
  --force         Force worktree removal
  --help          Show help
EOF
}

BOT_NAME=''
FORCE='false'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --bot)
      BOT_NAME="${2:-}"
      shift 2
      ;;
    --force)
      FORCE='true'
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

require_cmd bd
require_cmd tmux

STATE_FILE="$(bot_state_file "$BOT_NAME")"
load_bot_state "$STATE_FILE"

if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
  log "Stopping tmux session $TMUX_SESSION..."
  tmux kill-session -t "$TMUX_SESSION"
fi

WORKTREE_NAME="$(basename "$WORKTREE_PATH")"

if [[ -d "$WORKTREE_PATH" ]]; then
  log "Removing worktree $WORKTREE_NAME..."
  if [[ "$FORCE" == 'true' ]]; then
    bd worktree remove "$WORKTREE_NAME" --force
  else
    bd worktree remove "$WORKTREE_NAME"
  fi
fi

rm -f "$STATE_FILE"
log 'Cleanup complete.'
