# AGENTS.md

- Keep package scopes under `@corphish/*`.
- This template targets Railway + Supabase (no AuthJS and no AWS-specific infra scripts).
- Keep environment variables documented in `example.env` only.

## Task tracking (Beads)

- Use `bd` as the single source of truth for work (no separate TODO/plan docs).
- Start of session: `bd ready --json` → pick the top item → `bd show <id> --json` → `bd update <id> --claim`.
- When follow-up work is discovered, create a Beads issue immediately (link it to the current task with `--deps discovered-from:<id>` when applicable).
- Keep tasks small; if something is >30 minutes, split it into multiple issues.

## Multi-bot Worktrees (Required for Parallel Agents)

- Never code directly on `main`.
- Create each bot in its own worktree and branch:
  - Branch format is required: `YY-MM-DD/c0rphish/<pr-descriptive-name>`
  - Canonical bot id should be `<issue-id>-<pr-descriptive-name>` and reused across bot state, worktree, and actor naming.
  - `bd worktree create ../worktrees/<bot-name> --branch $(date +%y-%m-%d)/c0rphish/<bot-name>`
- Use one branch per bot per issue (no branch sharing between bots).
- Set bot identity before any `bd` write command:
  - `export BD_ACTOR=<bot-name>`
- Prefer operator scripts for consistency:
  - `pnpm bot:new -- --bot <bot-name> --title "<issue title>"`
  - `pnpm bot:start -- --bot <bot-name>`
  - `pnpm bot:land -- --bot <bot-name>`
  - `pnpm bot:cleanup -- --bot <bot-name>`
- One bot = one claimed issue at a time:
  - `bd ready --json` → pick top item → `bd show <id> --json` → `bd update <id> --claim`
  - Do not claim a second issue until the first is closed or explicitly re-assigned.
- PR flow is GitHub-based, even when bots run locally on one machine:
  - Push branch, open PR, and merge to `main` via PR only.
- Avoid runtime collisions between bots:
  - Use unique values per bot for `PORT`, `NEXT_PUBLIC_APP_URL`, and `DATABASE_URL` in that bot shell.
  - Example: `PORT=3001`, `NEXT_PUBLIC_APP_URL=http://localhost:3001`, DB name `corphish_<bot-name>`.
- Serialize final sync/push with merge-slot:
  - Ensure slot exists once per repo: `bd merge-slot create`
  - Before final `bd sync`/`git push`: `bd merge-slot acquire`
  - After finishing (success or failure): `bd merge-slot release`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create Beads issues (`bd create ...`) for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work (`bd close <id>`), update in-progress items (`bd update ...`)
4. **PUSH TO REMOTE** - This is MANDATORY:

   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```

5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
