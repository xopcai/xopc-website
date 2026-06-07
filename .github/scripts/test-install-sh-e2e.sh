#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALLER="$ROOT/public/install.sh"

export CI=1
export NO_PROMPT=1
export XOPC_NO_PROMPT=1
export XOPC_NO_REGISTRY_AUTODETECT=1

cleanup_xopc() {
  npm uninstall -g @xopcai/xopc 2>/dev/null || true
  rm -f "${HOME}/.local/bin/xopc" 2>/dev/null || true
}

ensure_xopc_on_path() {
  local npm_bin=""
  npm_bin="$(npm config get prefix 2>/dev/null || true)"
  if [[ -n "$npm_bin" && "$npm_bin" != "undefined" && "$npm_bin" != "null" ]]; then
    export PATH="${npm_bin}/bin:${PATH}"
  fi
  if [[ -x "${HOME}/.local/bin/xopc" ]]; then
    export PATH="${HOME}/.local/bin:${PATH}"
  fi
}

run_install() {
  bash "$INSTALLER" \
    --install-method npm \
    --no-prompt \
    --verify \
    --no-onboard
}

attempt=1
max_attempts=2

while [[ "$attempt" -le "$max_attempts" ]]; do
  echo "==> E2E attempt ${attempt}/${max_attempts}"
  cleanup_xopc

  if run_install; then
    ensure_xopc_on_path
    if command -v xopc >/dev/null 2>&1; then
      echo "==> Post-install smoke"
      xopc --version
      xopc --help | head -5
      echo "E2E npm install (install.sh) passed."
      exit 0
    fi
    echo "Installer succeeded but xopc is not on PATH in this shell." >&2
  else
    echo "install.sh E2E attempt ${attempt} failed." >&2
  fi

  attempt=$((attempt + 1))
  if [[ "$attempt" -le "$max_attempts" ]]; then
    sleep 5
  fi
done

echo "E2E npm install (install.sh) failed after ${max_attempts} attempts." >&2
exit 1
