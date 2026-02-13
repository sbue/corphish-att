#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'EOF'
Usage:
  pnpm bot:land -- --bot <bot-name> [--no-pr]

Options:
  --bot <name>    Canonical bot id used in bot:new
  --no-pr         Skip GitHub PR creation
  --help          Show help
EOF
}

BOT_NAME=''
CREATE_PR='true'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --bot)
      BOT_NAME="${2:-}"
      shift 2
      ;;
    --no-pr)
      CREATE_PR='false'
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
require_cmd git
require_cmd pnpm

STATE_FILE="$(bot_state_file "$BOT_NAME")"
load_bot_state "$STATE_FILE"

[[ -d "$WORKTREE_PATH" ]] || die "Worktree path does not exist: $WORKTREE_PATH"
cd "$WORKTREE_PATH"

CURRENT_BRANCH="$(git branch --show-current)"
[[ "$CURRENT_BRANCH" == "$BRANCH" ]] || warn "Current branch is $CURRENT_BRANCH (expected $BRANCH)"

MERGE_SLOT_HELD='false'
release_merge_slot() {
  if [[ "$MERGE_SLOT_HELD" == 'true' ]]; then
    bd merge-slot release >/dev/null 2>&1 || true
  fi
}
trap release_merge_slot EXIT

log 'Running quality gates...'
pnpm lint
pnpm type-check
pnpm build

if [[ -n "${ISSUE_ID:-}" ]]; then
  log "Closing Beads issue $ISSUE_ID..."
  BD_ACTOR="$BD_ACTOR" bd close "$ISSUE_ID" --reason "Completed via bot:land ($BOT_NAME)" >/dev/null || true
fi

log 'Acquiring merge slot...'
bd merge-slot create >/dev/null 2>&1 || true
bd merge-slot acquire >/dev/null
MERGE_SLOT_HELD='true'

log 'Syncing Beads...'
BD_ACTOR="$BD_ACTOR" bd sync

log 'Rebasing and pushing branch...'
git pull --rebase
git push -u origin "$BRANCH"

if [[ "$CREATE_PR" == 'true' && -n "${ISSUE_ID:-}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    if gh pr view --head "$BRANCH" --json url >/dev/null 2>&1; then
      log "PR already exists for $BRANCH."
    else
      PR_TITLE="$ISSUE_ID: $BOT_NAME"
      PR_BODY="Automated by bot:land for $ISSUE_ID."
      if ! gh pr create --base main --head "$BRANCH" --title "$PR_TITLE" --body "$PR_BODY"; then
        warn 'Failed to create PR via gh. Create it manually in GitHub.'
      fi
    fi
  else
    warn 'GitHub CLI (gh) not found. Skipping PR creation.'
  fi
fi

log 'Landing workflow completed.'
