#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PUBLIC="$ROOT/public"
INSTALLER="$PUBLIC/install.sh"
PORT="${INSTALLER_TEST_PORT:-8765}"
SERVER_PID=""

export CI=1
export NO_PROMPT=1
export XOPC_NO_PROMPT=1
export XOPC_NO_REGISTRY_AUTODETECT=1

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local label="$3"
  if [[ "$haystack" != *"$needle"* ]]; then
    echo "Expected output to contain '$needle' ($label)" >&2
    echo "--- output ---" >&2
    echo "$haystack" >&2
    exit 1
  fi
}

file_sha256() {
  local target="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$target" | awk '{print $1}'
  else
    shasum -a 256 "$target" | awk '{print $1}'
  fi
}

stream_sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | awk '{print $1}'
  else
    shasum -a 256 | awk '{print $1}'
  fi
}

wait_for_server() {
  local url="$1"
  local attempt
  for attempt in $(seq 1 40); do
    if curl -fsS "$url" -o /dev/null 2>/dev/null; then
      return 0
    fi
    sleep 0.25
  done
  echo "Timed out waiting for installer HTTP server at $url" >&2
  return 1
}

command -v python3 >/dev/null 2>&1 || { echo "python3 is required for pipe simulation" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required for pipe simulation" >&2; exit 1; }

echo "==> Starting local installer HTTP server on port ${PORT}"
python3 -m http.server "$PORT" --directory "$PUBLIC" >/dev/null 2>&1 &
SERVER_PID=$!

INSTALL_URL="http://127.0.0.1:${PORT}/install.sh"
wait_for_server "$INSTALL_URL"

echo "==> curl | bash with env-based dry-run (homepage-style pipe)"
export XOPC_DRY_RUN=1
export XOPC_INSTALL_METHOD=npm
out="$(curl -fsSL "$INSTALL_URL" | bash 2>&1)"
assert_contains "$out" "Dry run" "env dry-run via pipe"
assert_contains "$out" "npm" "npm method via env"

echo "==> curl | bash -s -- --dry-run --no-prompt --install-method git"
unset XOPC_DRY_RUN
out="$(curl -fsSL "$INSTALL_URL" | bash -s -- --dry-run --no-prompt --install-method git 2>&1)"
assert_contains "$out" "Install plan" "git dry-run via pipe args"
assert_contains "$out" "git" "git method via pipe args"

echo "==> Served install.sh matches local file (sha256)"
local_hash="$(file_sha256 "$INSTALLER")"
remote_hash="$(curl -fsSL "$INSTALL_URL" | stream_sha256)"
if [[ "$local_hash" != "$remote_hash" ]]; then
  echo "Served install.sh hash mismatch." >&2
  echo "  local:  $local_hash" >&2
  echo "  remote: $remote_hash" >&2
  exit 1
fi

echo "All install.sh pipe simulation checks passed."
