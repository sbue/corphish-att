#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'EOF'
Usage:
  pnpm bot:new -- --bot <bot-name> --title "<issue title>" [options]

Options:
  --bot <name>           Canonical bot id (recommended: <issue-id>-<slug>)
  --title <title>        Beads issue title
  --description <text>   Beads issue description
  --type <type>          Beads issue type (default: task)
  --priority <0-4>       Beads issue priority (default: 2)
  --port <port>          Fixed PORT override
  --help                 Show help
EOF
}

BOT_NAME=''
ISSUE_TITLE=''
ISSUE_DESCRIPTION=''
ISSUE_TYPE='task'
ISSUE_PRIORITY='2'
PORT_OVERRIDE=''

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --bot)
      BOT_NAME="${2:-}"
      shift 2
      ;;
    --title)
      ISSUE_TITLE="${2:-}"
      shift 2
      ;;
    --description)
      ISSUE_DESCRIPTION="${2:-}"
      shift 2
      ;;
    --type)
      ISSUE_TYPE="${2:-}"
      shift 2
      ;;
    --priority)
      ISSUE_PRIORITY="${2:-}"
      shift 2
      ;;
    --port)
      PORT_OVERRIDE="${2:-}"
      shift 2
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
[[ -n "$ISSUE_TITLE" ]] || die 'Missing required --title argument.'

require_cmd bd
require_cmd git
require_cmd tmux
require_cmd node

REPO_ROOT="$(repo_root)"
WORKTREE_PATH="$REPO_ROOT/../worktrees/$BOT_NAME"
STATE_FILE="$(bot_state_file "$BOT_NAME")"
BRANCH="$(branch_from_bot_name "$BOT_NAME")"
TMUX_SESSION="$(session_name_from_bot_name "$BOT_NAME")"
PORT="${PORT_OVERRIDE:-$(allocate_port "$BOT_NAME")}"
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:$PORT}"
DATABASE_NAME="$(database_name_from_bot_name "$BOT_NAME")"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/$DATABASE_NAME}"
BD_ACTOR="${BD_ACTOR:-c0rphish/$BOT_NAME}"

[[ ! -e "$STATE_FILE" ]] || die "Bot already exists in state: $STATE_FILE"
[[ ! -d "$WORKTREE_PATH" ]] || die "Worktree path already exists: $WORKTREE_PATH"

if [[ -z "$ISSUE_DESCRIPTION" ]]; then
  ISSUE_DESCRIPTION="Created by bot:new for $BOT_NAME on branch $BRANCH."
fi

log "Creating Beads issue..."
ISSUE_JSON="$(bd create --title "$ISSUE_TITLE" --description "$ISSUE_DESCRIPTION" --type "$ISSUE_TYPE" --priority "$ISSUE_PRIORITY" --json)"
ISSUE_ID="$(json_field "$ISSUE_JSON" 'id')"
[[ -n "$ISSUE_ID" ]] || die 'Failed to parse issue id from bd create output.'

log "Claiming issue $ISSUE_ID..."
BD_ACTOR="$BD_ACTOR" bd update "$ISSUE_ID" --claim >/dev/null

log "Creating worktree..."
mkdir -p "$(dirname "$WORKTREE_PATH")"
bd worktree create "$WORKTREE_PATH" --branch "$BRANCH" >/dev/null

log "Creating tmux session $TMUX_SESSION..."
ensure_tmux_session "$TMUX_SESSION" "$WORKTREE_PATH"
set_tmux_bot_env \
  "$TMUX_SESSION" \
  BOT_NAME "$BOT_NAME" \
  BD_ACTOR "$BD_ACTOR" \
  ISSUE_ID "$ISSUE_ID" \
  PORT "$PORT" \
  NEXT_PUBLIC_APP_URL "$NEXT_PUBLIC_APP_URL" \
  DATABASE_URL "$DATABASE_URL"

save_bot_state \
  "$STATE_FILE" \
  BOT_NAME "$BOT_NAME" \
  ISSUE_ID "$ISSUE_ID" \
  BRANCH "$BRANCH" \
  WORKTREE_PATH "$WORKTREE_PATH" \
  TMUX_SESSION "$TMUX_SESSION" \
  PORT "$PORT" \
  NEXT_PUBLIC_APP_URL "$NEXT_PUBLIC_APP_URL" \
  DATABASE_NAME "$DATABASE_NAME" \
  DATABASE_URL "$DATABASE_URL" \
  BD_ACTOR "$BD_ACTOR"

log "Bot created."
printf 'issue: %s\n' "$ISSUE_ID"
printf 'branch: %s\n' "$BRANCH"
printf 'worktree: %s\n' "$WORKTREE_PATH"
printf 'tmux: %s\n' "$TMUX_SESSION"
printf 'actor: %s\n' "$BD_ACTOR"
printf 'env: PORT=%s NEXT_PUBLIC_APP_URL=%s DATABASE_URL=%s\n' "$PORT" "$NEXT_PUBLIC_APP_URL" "$DATABASE_URL"
printf 'next: pnpm bot:start -- --bot %s\n' "$BOT_NAME"
