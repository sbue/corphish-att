#!/usr/bin/env bash

set -euo pipefail

log() {
  printf '[bot] %s\n' "$*"
}

warn() {
  printf '[bot][warn] %s\n' "$*" >&2
}

die() {
  printf '[bot][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

script_dir() {
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
}

repo_root() {
  local root
  root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  [[ -n "$root" ]] || die 'Run this command inside a git repository.'
  printf '%s\n' "$root"
}

bot_state_dir() {
  local root
  root="$(repo_root)"
  printf '%s/.bot\n' "$root"
}

bot_state_file() {
  local bot_name="$1"
  printf '%s/%s.env\n' "$(bot_state_dir)" "$bot_name"
}

json_field() {
  local json_payload="$1"
  local field="$2"

  printf '%s' "$json_payload" | node -e '
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      const payload = JSON.parse(data);
      const value = payload[process.argv[1]];
      process.stdout.write(value === undefined ? "" : String(value));
    });
  ' "$field"
}

branch_from_bot_name() {
  local bot_name="$1"
  printf '%s/c0rphish/%s\n' "$(date +%y-%m-%d)" "$bot_name"
}

session_name_from_bot_name() {
  local bot_name="$1"
  printf 'bot-%s\n' "$bot_name" | tr '/:' '--'
}

database_name_from_bot_name() {
  local bot_name="$1"
  local suffix

  suffix="$(printf '%s' "$bot_name" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '_' | sed 's/^_//; s/_$//')"
  printf 'corphish_%s\n' "$suffix"
}

allocate_port() {
  local bot_name="$1"
  local checksum

  checksum="$(printf '%s' "$bot_name" | cksum | awk '{print $1}')"
  printf '%s\n' "$((3100 + checksum % 2000))"
}

save_bot_state() {
  local state_file="$1"
  shift

  mkdir -p "$(dirname "$state_file")"
  : >"$state_file"

  while [[ $# -gt 1 ]]; do
    local key="$1"
    local value="$2"
    shift 2
    printf '%s=%q\n' "$key" "$value" >>"$state_file"
  done
}

load_bot_state() {
  local state_file="$1"
  [[ -f "$state_file" ]] || die "Missing bot state file: $state_file"

  set -a
  # shellcheck disable=SC1090
  source "$state_file"
  set +a
}

ensure_tmux_session() {
  local session="$1"
  local cwd="$2"

  if ! tmux has-session -t "$session" 2>/dev/null; then
    tmux new-session -d -s "$session" -c "$cwd"
  fi
}

set_tmux_bot_env() {
  local session="$1"

  shift
  while [[ $# -gt 1 ]]; do
    local key="$1"
    local value="$2"
    shift 2
    tmux set-environment -t "$session" "$key" "$value"
  done
}
