#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SH="$ROOT/public/install.sh"
PS1="$ROOT/public/install.ps1"

extract_sh() {
  local pattern="$1"
  local line
  line="$(grep -E "$pattern" "$SH" | head -n1 | tr -d '\r')"
  if [[ "$line" == *\"* ]]; then
    sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/' <<<"$line"
  else
    sed -E 's/^[^=]+=([0-9]+).*/\1/' <<<"$line"
  fi
}

extract_ps1() {
  local pattern="$1"
  local line
  line="$(grep -E "$pattern" "$PS1" | head -n1 | tr -d '\r')"
  if [[ "$line" == *\"* ]]; then
    sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/' <<<"$line"
  else
    sed -E 's/.*=[[:space:]]*([0-9]+).*/\1/' <<<"$line"
  fi
}

fail() {
  echo "check-installer-constants: $*" >&2
  exit 1
}

compare_pair() {
  local label="$1"
  local expected="$2"
  local sh_val="$3"
  local ps_val="$4"

  if [[ "$sh_val" != "$expected" ]]; then
    fail "$label mismatch in install.sh: got '$sh_val', want '$expected'"
  fi
  if [[ "$ps_val" != "$expected" ]]; then
    fail "$label mismatch in install.ps1: got '$ps_val', want '$expected'"
  fi
  if [[ "$sh_val" != "$ps_val" ]]; then
    fail "$label mismatch between scripts: sh='$sh_val' ps1='$ps_val'"
  fi
}

[[ -f "$SH" ]] || fail "missing $SH"
[[ -f "$PS1" ]] || fail "missing $PS1"

compare_pair "package" "@xopcai/xopc" "$(extract_sh '^PACKAGE_NAME=')" "$(extract_ps1 '^\$script:PackageName\s*=')"
compare_pair "bin" "xopc" "$(extract_sh '^BIN_NAME=')" "$(extract_ps1 '^\$script:BinName\s*=')"
compare_pair "repo_slug" "xopcai/xopc" "$(extract_sh '^REPO_SLUG=')" "$(extract_ps1 '^\$script:RepoSlug\s*=')"
compare_pair "node_min_major" "22" "$(extract_sh '^NODE_MIN_MAJOR=')" "$(extract_ps1 '^\$script:NodeMinMajor\s*=')"
compare_pair "node_min_minor" "0" "$(extract_sh '^NODE_MIN_MINOR=')" "$(extract_ps1 '^\$script:NodeMinMinor\s*=')"
compare_pair "site_url" "https://xopc.ai" "$(extract_sh '^SITE_URL=')" "$(extract_ps1 '^\$script:SiteUrl\s*=')"

echo "Installer constants OK (package, bin, repo, node min, site URL)"
