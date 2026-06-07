#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALLER="$ROOT/public/install.sh"

export CI=1
export NO_PROMPT=1
export XOPC_NO_PROMPT=1
export XOPC_NO_REGISTRY_AUTODETECT=1

run_expect() {
  local expected_exit="$1"
  shift
  set +e
  "$@"
  local code=$?
  set -e
  if [[ "$code" -ne "$expected_exit" ]]; then
    echo "Expected exit $expected_exit, got $code: $*" >&2
    exit 1
  fi
}

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

echo "==> install.sh --help"
out="$(bash "$INSTALLER" --help)"
assert_contains "$out" "xopc installer" "help banner"
assert_contains "$out" "--dry-run" "help dry-run flag"

echo "==> install.sh --dry-run npm"
out="$(bash "$INSTALLER" --dry-run --no-prompt --install-method npm)"
assert_contains "$out" "Install plan" "npm dry-run plan"
assert_contains "$out" "npm" "npm method"

echo "==> install.sh --dry-run git"
out="$(bash "$INSTALLER" --dry-run --no-prompt --install-method git)"
assert_contains "$out" "Install plan" "git dry-run plan"
assert_contains "$out" "git" "git method"

echo "==> install.sh invalid install method"
run_expect 1 bash "$INSTALLER" --install-method invalid --no-prompt

echo "==> install.sh --dry-run --cn"
out="$(bash "$INSTALLER" --dry-run --no-prompt --install-method npm --cn)"
assert_contains "$out" "registry.npmmirror.com" "cn registry"

echo "==> install.sh piped non-interactive (stdin closed)"
run_expect 0 bash "$INSTALLER" --dry-run --no-prompt </dev/null

echo "==> install.sh curl-style pipe"
run_expect 0 bash -c "printf '' | bash '$INSTALLER' --dry-run --no-prompt"

echo "All install.sh behavioral checks passed."
