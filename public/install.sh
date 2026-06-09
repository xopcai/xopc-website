#!/bin/bash
set -euo pipefail

# xopc Installer for macOS and Linux
# Usage: curl -fsSL https://xopc.ai/install.sh | bash

# ─── Package identity ───
PACKAGE_NAME="@xopcai/xopc"
BIN_NAME="xopc"
REPO_URL="https://github.com/xopcai/xopc.git"
REPO_SLUG="xopcai/xopc"
SITE_URL="https://xopc.ai"

# ─── Colors ───
BOLD='\033[1m'
ACCENT='\033[38;2;77;158;255m'        # brand blue #4d9eff
# shellcheck disable=SC2034
ACCENT_BRIGHT='\033[38;2;110;178;255m'
INFO='\033[38;2;136;146;176m'          # text-secondary #8892b0
SUCCESS='\033[38;2;0;229;204m'         # cyan-bright   #00e5cc
WARN='\033[38;2;255;176;32m'           # amber
ERROR='\033[38;2;230;57;70m'           # coral-mid     #e63946
MUTED='\033[38;2;90;100;128m'          # text-muted    #5a6480
NC='\033[0m'

# ─── Node.js version thresholds ───
NODE_DEFAULT_MAJOR=22
NODE_MIN_MAJOR=22
NODE_MIN_MINOR=0
NODE_MIN_VERSION="${NODE_MIN_MAJOR}.${NODE_MIN_MINOR}"

ORIGINAL_PATH="${PATH:-}"

# ─── Taglines ───
TAGLINES=(
    "Your terminal just grew smarter — type something and let xopc handle the rest."
    "One CLI to run them all. Gateway online."
    "Personal OPC workstation: CLI, gateway, multi-channel. You're welcome."
    "Automation with taste: minimal fuss, maximal output."
    "If it's repetitive, xopc automates it. If it's hard, xopc brings a rollback plan."
)
DEFAULT_TAGLINE="Personal OPC workstation that grows with you."

pick_tagline() {
    local count=${#TAGLINES[@]}
    if [[ "$count" -eq 0 ]]; then
        echo "$DEFAULT_TAGLINE"
        return
    fi
    local idx=$((RANDOM % count))
    echo "${TAGLINES[$idx]}"
}

TAGLINE=$(pick_tagline)

# ─── Temp file management ───
TMPFILES=()
cleanup_tmpfiles() {
    local f
    for f in "${TMPFILES[@]:-}"; do
        rm -rf "$f" 2>/dev/null || true
    done
}
trap cleanup_tmpfiles EXIT

mktempfile() {
    local f
    f="$(mktemp)"
    TMPFILES+=("$f")
    echo "$f"
}

# ─── Downloader ───
DOWNLOADER=""
detect_downloader() {
    if command -v curl &> /dev/null; then
        DOWNLOADER="curl"
        return 0
    fi
    if command -v wget &> /dev/null; then
        DOWNLOADER="wget"
        return 0
    fi
    ui_error "Missing downloader (curl or wget required)"
    exit 1
}

download_file() {
    local url="$1"
    local output="$2"
    if [[ -z "$DOWNLOADER" ]]; then
        detect_downloader
    fi
    if [[ "$DOWNLOADER" == "curl" ]]; then
        curl -fsSL --proto '=https' --tlsv1.2 --retry 3 --retry-delay 1 --retry-connrefused -o "$output" "$url"
        return
    fi
    wget -q --https-only --secure-protocol=TLSv1_2 --tries=3 --timeout=20 -O "$output" "$url"
}

run_remote_bash() {
    local url="$1"
    local tmp
    tmp="$(mktempfile)"
    download_file "$url" "$tmp"
    /bin/bash "$tmp"
}

# ─── Gum TUI bootstrap ───
GUM_VERSION="${XOPC_GUM_VERSION:-0.17.0}"
GUM=""
GUM_STATUS="skipped"
GUM_REASON=""
LAST_NPM_INSTALL_CMD=""

is_non_interactive_shell() {
    if [[ "${NO_PROMPT:-0}" == "1" ]]; then
        return 0
    fi
    if [[ ! -t 0 || ! -t 1 ]]; then
        return 0
    fi
    return 1
}

has_controlling_tty() {
    if [[ ! -r /dev/tty || ! -w /dev/tty ]]; then
        return 1
    fi
    if ! { : </dev/tty; } 2>/dev/null; then
        return 1
    fi
    return 0
}

gum_is_tty() {
    if [[ -n "${NO_COLOR:-}" ]]; then
        return 1
    fi
    if [[ "${TERM:-dumb}" == "dumb" ]]; then
        return 1
    fi
    if [[ -t 2 || -t 1 ]]; then
        return 0
    fi
    if has_controlling_tty; then
        return 0
    fi
    return 1
}

gum_detect_os() {
    case "$(uname -s 2>/dev/null || true)" in
        Darwin) echo "Darwin" ;;
        Linux) echo "Linux" ;;
        *) echo "unsupported" ;;
    esac
}

gum_detect_arch() {
    case "$(uname -m 2>/dev/null || true)" in
        x86_64|amd64) echo "x86_64" ;;
        arm64|aarch64) echo "arm64" ;;
        i386|i686) echo "i386" ;;
        armv7l|armv7) echo "armv7" ;;
        armv6l|armv6) echo "armv6" ;;
        *) echo "unknown" ;;
    esac
}

verify_sha256sum_file() {
    local checksums="$1"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum --ignore-missing -c "$checksums" >/dev/null 2>&1
        return $?
    fi
    if command -v shasum >/dev/null 2>&1; then
        shasum -a 256 --ignore-missing -c "$checksums" >/dev/null 2>&1
        return $?
    fi
    return 1
}

bootstrap_gum_temp() {
    GUM=""
    GUM_STATUS="skipped"
    GUM_REASON=""

    if is_non_interactive_shell; then
        GUM_REASON="non-interactive shell (auto-disabled)"
        return 1
    fi

    if ! gum_is_tty; then
        GUM_REASON="terminal does not support gum UI"
        return 1
    fi

    if command -v gum >/dev/null 2>&1; then
        GUM="gum"
        GUM_STATUS="found"
        GUM_REASON="already installed"
        return 0
    fi

    if ! command -v tar >/dev/null 2>&1; then
        GUM_REASON="tar not found"
        return 1
    fi

    local os arch asset base gum_tmpdir gum_path
    os="$(gum_detect_os)"
    arch="$(gum_detect_arch)"
    if [[ "$os" == "unsupported" || "$arch" == "unknown" ]]; then
        GUM_REASON="unsupported os/arch ($os/$arch)"
        return 1
    fi

    asset="gum_${GUM_VERSION}_${os}_${arch}.tar.gz"
    base="https://github.com/charmbracelet/gum/releases/download/v${GUM_VERSION}"

    gum_tmpdir="$(mktemp -d)"
    TMPFILES+=("$gum_tmpdir")

    ui_info "Preparing spinner support"
    if ! download_file "${base}/${asset}" "$gum_tmpdir/$asset"; then
        GUM_REASON="download failed"
        return 1
    fi

    ui_info "Verifying spinner support download"
    if ! download_file "${base}/checksums.txt" "$gum_tmpdir/checksums.txt"; then
        GUM_REASON="checksum unavailable or failed"
        return 1
    fi

    if ! (cd "$gum_tmpdir" && verify_sha256sum_file "checksums.txt"); then
        GUM_REASON="checksum unavailable or failed"
        return 1
    fi

    if ! tar -xzf "$gum_tmpdir/$asset" -C "$gum_tmpdir" >/dev/null 2>&1; then
        GUM_REASON="extract failed"
        return 1
    fi

    gum_path="$(find "$gum_tmpdir" -type f -name gum 2>/dev/null | head -n1 || true)"
    if [[ -z "$gum_path" ]]; then
        GUM_REASON="gum binary missing after extract"
        return 1
    fi

    chmod +x "$gum_path" >/dev/null 2>&1 || true
    if [[ ! -x "$gum_path" ]]; then
        GUM_REASON="gum binary is not executable"
        return 1
    fi

    GUM="$gum_path"
    GUM_STATUS="installed"
    GUM_REASON="temp, verified"
    return 0
}

print_gum_status() {
    case "$GUM_STATUS" in
        found)
            ui_success "gum available (${GUM_REASON})"
            ;;
        installed)
            ui_success "gum bootstrapped (${GUM_REASON}, v${GUM_VERSION})"
            ;;
        *)
            if [[ -n "$GUM_REASON" && "$GUM_REASON" != "non-interactive shell (auto-disabled)" ]]; then
                ui_info "gum skipped (${GUM_REASON})"
            fi
            ;;
    esac
}

# ─── UI functions ───
print_installer_banner() {
    if [[ -n "$GUM" ]]; then
        local title tagline hint card
        title="$("$GUM" style --foreground "#4d9eff" --bold "⚡ xopc Installer")"
        tagline="$("$GUM" style --foreground "#8892b0" "$TAGLINE")"
        hint="$("$GUM" style --foreground "#5a6480" "modern installer mode")"
        card="$(printf '%s\n%s\n%s' "$title" "$tagline" "$hint")"
        "$GUM" style --border rounded --border-foreground "#4d9eff" --padding "1 2" "$card"
        echo ""
        return
    fi

    echo -e "${ACCENT}${BOLD}"
    echo "  ⚡ xopc Installer"
    echo -e "${NC}${INFO}  ${TAGLINE}${NC}"
    echo ""
}

detect_os_or_die() {
    OS="unknown"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux"* ]] || [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
        OS="linux"
    fi

    if [[ "$OS" == "unknown" ]]; then
        ui_error "Unsupported operating system"
        echo "This installer supports macOS and Linux (including WSL)."
        echo "For Windows, use: npm install -g ${PACKAGE_NAME}"
        exit 1
    fi

    ui_success "Detected: $OS"
}

ui_info() {
    local msg="$*"
    if [[ -n "$GUM" ]]; then
        "$GUM" log --level info "$msg"
    else
        echo -e "${MUTED}·${NC} ${msg}"
    fi
}

ui_warn() {
    local msg="$*"
    if [[ -n "$GUM" ]]; then
        "$GUM" log --level warn "$msg"
    else
        echo -e "${WARN}!${NC} ${msg}"
    fi
}

ui_success() {
    local msg="$*"
    if [[ -n "$GUM" ]]; then
        local mark
        mark="$("$GUM" style --foreground "#00e5cc" --bold "✔")"
        echo "${mark} ${msg}"
    else
        echo -e "${SUCCESS}✔${NC} ${msg}"
    fi
}

ui_error() {
    local msg="$*"
    if [[ -n "$GUM" ]]; then
        "$GUM" log --level error "$msg"
    else
        echo -e "${ERROR}✗${NC} ${msg}"
    fi
}

INSTALL_STAGE_TOTAL=3
INSTALL_STAGE_CURRENT=0

configure_install_stage_total() {
    INSTALL_STAGE_TOTAL=3
    INSTALL_STAGE_CURRENT=0
    if [[ "${VERIFY_INSTALL:-0}" == "1" ]]; then
        INSTALL_STAGE_TOTAL=4
    fi
}

ui_section() {
    local title="$1"
    if [[ -n "$GUM" ]]; then
        "$GUM" style --bold --foreground "#4d9eff" --padding "1 0" "$title"
    else
        echo ""
        echo -e "${ACCENT}${BOLD}${title}${NC}"
    fi
}

ui_stage() {
    local title="$1"
    INSTALL_STAGE_CURRENT=$((INSTALL_STAGE_CURRENT + 1))
    ui_section "[${INSTALL_STAGE_CURRENT}/${INSTALL_STAGE_TOTAL}] ${title}"
}

ui_kv() {
    local key="$1"
    local value="$2"
    if [[ -n "$GUM" ]]; then
        local key_part value_part
        key_part="$("$GUM" style --foreground "#5a6480" --width 20 "$key")"
        value_part="$("$GUM" style --bold "$value")"
        "$GUM" join --horizontal "$key_part" "$value_part"
    else
        echo -e "${MUTED}${key}:${NC} ${value}"
    fi
}

ui_panel() {
    local content="$1"
    if [[ -n "$GUM" ]]; then
        "$GUM" style --border rounded --border-foreground "#5a6480" --padding "0 1" "$content"
    else
        echo "$content"
    fi
}

ui_celebrate() {
    local msg="$1"
    if [[ -n "$GUM" ]]; then
        "$GUM" style --bold --foreground "#00e5cc" "$msg"
    else
        echo -e "${SUCCESS}${BOLD}${msg}${NC}"
    fi
}

is_shell_function() {
    local name="${1:-}"
    [[ -n "$name" ]] && declare -F "$name" >/dev/null 2>&1
}

is_gum_raw_mode_failure() {
    local err_log="$1"
    [[ -s "$err_log" ]] || return 1
    grep -Eiq 'setrawmode|inappropriate ioctl' "$err_log"
}

run_with_spinner() {
    local title="$1"
    shift

    if [[ -n "$GUM" ]] && gum_is_tty && ! is_shell_function "${1:-}"; then
        local gum_err gum_out
        gum_err="$(mktempfile)"
        gum_out="$(mktempfile)"
        if "$GUM" spin --spinner dot --title "$title" -- "$@" >"$gum_out" 2>"$gum_err"; then
            if is_gum_raw_mode_failure "$gum_out" || is_gum_raw_mode_failure "$gum_err"; then
                GUM=""
                GUM_STATUS="skipped"
                GUM_REASON="gum raw mode unavailable"
                ui_warn "Spinner unavailable in this terminal; continuing without spinner"
                "$@"
                return $?
            fi
            if [[ -s "$gum_out" ]]; then
                cat "$gum_out"
            fi
            return 0
        fi
        local gum_status=$?
        if is_gum_raw_mode_failure "$gum_err" || is_gum_raw_mode_failure "$gum_out"; then
            GUM=""
            GUM_STATUS="skipped"
            GUM_REASON="gum raw mode unavailable"
            ui_warn "Spinner unavailable in this terminal; continuing without spinner"
            "$@"
            return $?
        fi
        if [[ -s "$gum_err" ]]; then
            cat "$gum_err" >&2
        fi
        return "$gum_status"
    fi

    "$@"
}

run_quiet_step() {
    local title="$1"
    shift

    if [[ "$VERBOSE" == "1" ]]; then
        run_with_spinner "$title" "$@"
        return $?
    fi

    local log
    log="$(mktempfile)"
    local showed_progress=false

    if [[ -n "$GUM" ]] && gum_is_tty && ! is_shell_function "${1:-}"; then
        local cmd_quoted=""
        local log_quoted=""
        printf -v cmd_quoted '%q ' "$@"
        printf -v log_quoted '%q' "$log"
        if run_with_spinner "$title" bash -c "${cmd_quoted}>${log_quoted} 2>&1"; then
            return 0
        fi
        showed_progress=true
    else
        ui_info "${title}"
        showed_progress=true
        if "$@" >"$log" 2>&1; then
            return 0
        fi
    fi

    if [[ "$showed_progress" == "false" ]]; then
        ui_info "${title}"
    fi

    ui_error "${title} failed — re-run with --verbose for details"
    if [[ -s "$log" ]]; then
        tail -n 80 "$log" >&2 || true
    fi
    return 1
}

# ─── Install plan display ───
show_install_plan() {
    local detected_checkout="$1"

    ui_section "Install plan"
    ui_kv "OS" "$OS"
    ui_kv "Install method" "$INSTALL_METHOD"
    ui_kv "Requested version" "$XOPC_VERSION"
    if [[ "$USE_BETA" == "1" ]]; then
        ui_kv "Beta channel" "enabled"
    fi
    if [[ "$INSTALL_METHOD" == "git" ]]; then
        ui_kv "Git directory" "$GIT_DIR"
        ui_kv "Git update" "$GIT_UPDATE"
    fi
    if [[ -n "$detected_checkout" ]]; then
        ui_kv "Detected checkout" "$detected_checkout"
    fi
    if [[ -n "$NPM_REGISTRY" && "$NPM_REGISTRY" != "https://registry.npmjs.org" ]]; then
        ui_kv "npm registry" "$NPM_REGISTRY"
    fi
    if [[ "$DRY_RUN" == "1" ]]; then
        ui_kv "Dry run" "yes"
    fi
    if [[ "$NO_ONBOARD" == "1" ]]; then
        ui_kv "Onboarding" "skipped"
    fi
}

show_footer_links() {
    local faq_url="https://github.com/${REPO_SLUG}#quick-start"
    if [[ -n "$GUM" ]]; then
        local content
        content="$(printf '%s\n%s' "Need help?" "Docs: ${faq_url}")"
        ui_panel "$content"
    else
        echo ""
        echo -e "Docs: ${INFO}${faq_url}${NC}"
    fi
}

# ─── Bounded probe ───
bounded_probe_output() {
    local label="$1"
    shift
    local timeout_seconds="${XOPC_INSTALL_PROBE_TIMEOUT_SECONDS:-5}"
    local output_file status_file timeout_file pid watchdog status
    output_file="$(mktemp)"
    status_file="$(mktemp)"
    timeout_file="$(mktemp)"
    TMPFILES+=("$output_file" "$status_file" "$timeout_file")

    (
        "$@" >"$output_file" 2>/dev/null
        printf '%s' "$?" >"$status_file"
    ) &
    pid="$!"

    (
        sleep "$timeout_seconds"
        if kill -0 "$pid" 2>/dev/null; then
            printf '1' >"$timeout_file"
            kill "$pid" 2>/dev/null || true
            sleep 0.1
            kill -9 "$pid" 2>/dev/null || true
            printf 'timeout' >"$status_file"
        fi
    ) &
    watchdog="$!"

    wait "$pid" 2>/dev/null || true
    kill "$watchdog" 2>/dev/null || true
    wait "$watchdog" 2>/dev/null || true

    status="$(cat "$status_file" 2>/dev/null || true)"
    if [[ -s "$timeout_file" || "$status" == "timeout" ]]; then
        echo "Warning: timed out during installer finalization probe: ${label}" >&2
        return 124
    fi

    cat "$output_file" 2>/dev/null || true
    if [[ -n "$status" && "$status" =~ ^[0-9]+$ ]]; then
        return "$status"
    fi
    return 1
}

# ─── Linux distro detection ───
is_arch_linux() {
    if [[ -f /etc/os-release ]]; then
        local os_id
        os_id="$(grep -E '^ID=' /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"' || true)"
        case "$os_id" in
            arch|manjaro|endeavouros|arcolinux|garuda|archarm|cachyos|archcraft)
                return 0
                ;;
        esac
        local os_id_like
        os_id_like="$(grep -E '^ID_LIKE=' /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"' || true)"
        if [[ "$os_id_like" == *arch* ]]; then
            return 0
        fi
    fi
    if command -v pacman &> /dev/null; then
        return 0
    fi
    return 1
}

is_alpine_linux() {
    if [[ -f /etc/alpine-release ]]; then
        return 0
    fi
    if [[ -f /etc/os-release ]]; then
        local os_id os_id_like
        os_id="$(grep -E '^ID=' /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"' || true)"
        os_id_like="$(grep -E '^ID_LIKE=' /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"' || true)"
        if [[ "$os_id" == "alpine" || "$os_id_like" == *alpine* ]]; then
            return 0
        fi
    fi
    return 1
}

is_root() {
    [[ "$(id -u)" -eq 0 ]]
}

maybe_sudo() {
    if is_root; then
        if [[ "${1:-}" == "-E" ]]; then
            shift
        fi
        "$@"
    else
        sudo "$@"
    fi
}

require_sudo() {
    if [[ "$OS" != "linux" ]]; then
        return 0
    fi
    if is_root; then
        return 0
    fi
    if command -v sudo &> /dev/null; then
        if ! sudo -n true >/dev/null 2>&1; then
            ui_info "Administrator privileges required; enter your password"
            sudo -v
        fi
        return 0
    fi
    ui_error "sudo is required for system installs on Linux"
    echo "  Install sudo or re-run as root."
    exit 1
}

# ─── apt helpers ───
apt_get() {
    if is_root; then
        env DEBIAN_FRONTEND="${DEBIAN_FRONTEND:-noninteractive}" NEEDRESTART_MODE="${NEEDRESTART_MODE:-a}" apt-get "$@"
    else
        sudo env DEBIAN_FRONTEND="${DEBIAN_FRONTEND:-noninteractive}" NEEDRESTART_MODE="${NEEDRESTART_MODE:-a}" apt-get "$@"
    fi
}

apt_get_update() {
    apt_get update -qq
}

apt_get_install() {
    apt_get install -y -qq \
        -o Dpkg::Options::=--force-confdef \
        -o Dpkg::Options::=--force-confold \
        "$@"
}

# ─── Build tools ───
install_build_tools_linux() {
    require_sudo

    if command -v apt-get &> /dev/null; then
        run_quiet_step "Updating package index" apt_get_update
        run_quiet_step "Installing build tools" apt_get_install build-essential python3 make g++ cmake
        return 0
    fi

    if command -v pacman &> /dev/null || is_arch_linux; then
        if is_root; then
            run_quiet_step "Installing build tools" pacman -Sy --noconfirm base-devel python make cmake gcc
        else
            run_quiet_step "Installing build tools" sudo pacman -Sy --noconfirm base-devel python make cmake gcc
        fi
        return 0
    fi

    if command -v dnf &> /dev/null; then
        if is_root; then
            run_quiet_step "Installing build tools" dnf install -y -q gcc gcc-c++ make cmake python3
        else
            run_quiet_step "Installing build tools" sudo dnf install -y -q gcc gcc-c++ make cmake python3
        fi
        return 0
    fi

    if command -v yum &> /dev/null; then
        if is_root; then
            run_quiet_step "Installing build tools" yum install -y -q gcc gcc-c++ make cmake python3
        else
            run_quiet_step "Installing build tools" sudo yum install -y -q gcc gcc-c++ make cmake python3
        fi
        return 0
    fi

    if command -v apk &> /dev/null && is_alpine_linux; then
        if is_root; then
            run_quiet_step "Installing build tools" apk add --no-cache build-base python3 cmake
        else
            run_quiet_step "Installing build tools" sudo apk add --no-cache build-base python3 cmake
        fi
        return 0
    fi

    ui_warn "Could not detect package manager for auto-installing build tools"
    return 1
}

install_build_tools_macos() {
    local ok=true

    if ! xcode-select -p >/dev/null 2>&1; then
        ui_info "Installing Xcode Command Line Tools (required for make/clang)"
        xcode-select --install >/dev/null 2>&1 || true
        if ! xcode-select -p >/dev/null 2>&1; then
            ui_warn "Xcode Command Line Tools are not ready yet"
            ui_info "Complete the installer dialog, then re-run this installer"
            ok=false
        fi
    fi

    if ! command -v cmake >/dev/null 2>&1; then
        if command -v brew >/dev/null 2>&1; then
            run_quiet_step "Installing cmake" brew install cmake
        else
            ui_warn "Homebrew not available; cannot auto-install cmake"
            ok=false
        fi
    fi

    if ! command -v make >/dev/null 2>&1; then
        ui_warn "make is still unavailable"
        ok=false
    fi
    if ! command -v cmake >/dev/null 2>&1; then
        ui_warn "cmake is still unavailable"
        ok=false
    fi

    [[ "$ok" == "true" ]]
}

npm_log_indicates_missing_build_tools() {
    local log="$1"
    if [[ -z "$log" || ! -f "$log" ]]; then
        return 1
    fi
    grep -Eiq "(not found: make|make: command not found|cmake: command not found|CMAKE_MAKE_PROGRAM is not set|Could not find CMAKE|gyp ERR! find Python|no developer tools were found|is not able to compile a simple test program|Failed to build llama\\.cpp|It seems that \"make\" is not installed in your system|It seems that the used \"cmake\" doesn't work properly)" "$log"
}

auto_install_build_tools_for_npm_failure() {
    local log="$1"
    if ! npm_log_indicates_missing_build_tools "$log"; then
        return 1
    fi

    ui_warn "Detected missing native build tools; attempting automatic setup"
    if [[ "$OS" == "linux" ]]; then
        install_build_tools_linux || return 1
    elif [[ "$OS" == "macos" ]]; then
        install_build_tools_macos || return 1
    else
        return 1
    fi
    ui_success "Build tools setup complete"
    return 0
}

# ─── npm config helpers ───
resolve_npm_config_path() {
    local raw="$1"
    if [[ -z "$raw" || "$raw" == "null" || "$raw" == "undefined" ]]; then
        return 1
    fi
    if [[ "$raw" == \~/* && -n "${HOME:-}" ]]; then
        printf '%s\n' "${HOME}/${raw#"~/"}"
        return 0
    fi
    if [[ "$raw" == "\${HOME}/"* && -n "${HOME:-}" ]]; then
        printf '%s\n' "${HOME}/${raw#"\${HOME}/"}"
        return 0
    fi
    printf '%s\n' "$raw"
}

npm_config_file_has_key() {
    local file="$1"
    local key="$2"
    [[ -f "$file" ]] || return 1
    grep -Eiq "^[[:space:]]*${key}[[:space:]]*=" "$file"
}

npm_command_path() {
    local npm_cmd="$1"
    local npm_path="$npm_cmd"
    if [[ "$npm_path" != */* ]]; then
        npm_path="$(command -v "$npm_cmd" 2>/dev/null)" || return 1
    fi
    if command -v node >/dev/null 2>&1; then
        node -e 'const fs = require("node:fs"); console.log(fs.realpathSync(process.argv[1]));' "$npm_path" 2>/dev/null && return 0
    fi
    printf '%s\n' "$npm_path"
}

npm_builtin_config_path() {
    local npm_cmd="$1"
    local npm_path
    npm_path="$(npm_command_path "$npm_cmd")" || return 1
    local npm_root
    npm_root="$(cd "$(dirname "$npm_path")/.." >/dev/null 2>&1 && pwd -P)" || return 1
    printf '%s\n' "${npm_root}/npmrc"
}

npm_config_has_raw_key() {
    local npm_cmd="$1"
    local key="$2"
    local raw=""
    local file=""
    local -a files=()

    raw="${NPM_CONFIG_USERCONFIG:-${npm_config_userconfig:-}}"
    if [[ -n "$raw" ]]; then
        file="$(resolve_npm_config_path "$raw" 2>/dev/null || true)"
        [[ -n "$file" ]] && files+=("$file")
    elif [[ -n "${HOME:-}" ]]; then
        files+=("${HOME}/.npmrc")
    fi

    raw="${NPM_CONFIG_GLOBALCONFIG:-${npm_config_globalconfig:-}}"
    if [[ -n "$raw" ]]; then
        file="$(resolve_npm_config_path "$raw" 2>/dev/null || true)"
        [[ -n "$file" ]] && files+=("$file")
    fi

    raw="$(env -u NPM_CONFIG_BEFORE -u npm_config_before -u NPM_CONFIG_MIN_RELEASE_AGE -u npm_config_min_release_age -u npm_config_min-release-age "$npm_cmd" config get globalconfig --global 2>/dev/null || true)"
    file="$(resolve_npm_config_path "$raw" 2>/dev/null || true)"
    [[ -n "$file" ]] && files+=("$file")

    file="$(npm_builtin_config_path "$npm_cmd" 2>/dev/null || true)"
    [[ -n "$file" ]] && files+=("$file")

    for file in "${files[@]}"; do
        if npm_config_file_has_key "$file" "$key"; then
            return 0
        fi
    done
    return 1
}

# ─── npm global install core ───
run_npm_global_install() {
    local spec="$1"
    local log="$2"
    shift 2
    local extra_args=("$@")

    local freshness_flag="--min-release-age=0"
    local min_release_age=""
    min_release_age="$(env -u NPM_CONFIG_BEFORE -u npm_config_before npm config get min-release-age --global 2>/dev/null || true)"
    if npm_config_has_raw_key npm "min-release-age"; then
        freshness_flag="--min-release-age=0"
    elif [[ -z "$min_release_age" || "$min_release_age" == "null" || "$min_release_age" == "undefined" ]]; then
        local before_value=""
        before_value="$(env -u NPM_CONFIG_MIN_RELEASE_AGE -u npm_config_min_release_age -u npm_config_min-release-age npm config get before --global 2>/dev/null || true)"
        if [[ -n "$before_value" && "$before_value" != "null" && "$before_value" != "undefined" ]]; then
            freshness_flag="--before=$(date -u '+%Y-%m-%dT%H:%M:%S.000Z')"
        fi
    fi

    local -a cmd
    cmd=(env -u NPM_CONFIG_BEFORE -u npm_config_before -u NPM_CONFIG_MIN_RELEASE_AGE -u npm_config_min_release_age -u npm_config_min-release-age npm --loglevel "$NPM_LOGLEVEL")
    if [[ -n "$NPM_SILENT_FLAG" ]]; then
        cmd+=("$NPM_SILENT_FLAG")
    fi
    cmd+=(--no-fund --no-audit "$freshness_flag" install -g "$spec")
    if [[ ${#extra_args[@]} -gt 0 ]]; then
        cmd+=("${extra_args[@]}")
    fi
    local cmd_display=""
    printf -v cmd_display '%q ' "${cmd[@]}"
    LAST_NPM_INSTALL_CMD="${cmd_display% }"

    if [[ "$VERBOSE" == "1" ]]; then
        "${cmd[@]}" 2>&1 | tee "$log"
        return $?
    fi

    if [[ -n "$GUM" ]] && gum_is_tty; then
        local cmd_quoted=""
        local log_quoted=""
        printf -v cmd_quoted '%q ' "${cmd[@]}"
        printf -v log_quoted '%q' "$log"
        run_with_spinner "Installing xopc package" bash -c "${cmd_quoted}>${log_quoted} 2>&1"
        return $?
    fi

    ui_info "Installing xopc package"
    "${cmd[@]}" >"$log" 2>&1
}

# ─── npm diagnostics ───
extract_npm_debug_log_path() {
    local log="$1"
    local path=""
    path="$(sed -n -E 's/.*A complete log of this run can be found in:[[:space:]]*//p' "$log" | tail -n1)"
    if [[ -n "$path" ]]; then
        echo "$path"
        return 0
    fi
    path="$(grep -Eo '/[^[:space:]]+_logs/[^[:space:]]+debug[^[:space:]]*\.log' "$log" | tail -n1 || true)"
    if [[ -n "$path" ]]; then
        echo "$path"
        return 0
    fi
    return 1
}

extract_first_npm_error_line() {
    local log="$1"
    grep -E 'npm (ERR!|error)|ERR!' "$log" | head -n1 || true
}

extract_npm_error_code() {
    local log="$1"
    sed -n -E 's/^npm (ERR!|error) code[[:space:]]+([^[:space:]]+).*$/\2/p' "$log" | head -n1
}

extract_npm_error_syscall() {
    local log="$1"
    sed -n -E 's/^npm (ERR!|error) syscall[[:space:]]+(.+)$/\2/p' "$log" | head -n1
}

extract_npm_error_errno() {
    local log="$1"
    sed -n -E 's/^npm (ERR!|error) errno[[:space:]]+(.+)$/\2/p' "$log" | head -n1
}

print_npm_failure_diagnostics() {
    local spec="$1"
    local log="$2"

    ui_warn "npm install failed for ${spec}"
    if [[ -n "${LAST_NPM_INSTALL_CMD}" ]]; then
        echo "  Command: ${LAST_NPM_INSTALL_CMD}"
    fi
    echo "  Installer log: ${log}"

    local error_code error_syscall error_errno debug_log first_error
    error_code="$(extract_npm_error_code "$log")"
    [[ -n "$error_code" ]] && echo "  npm code: ${error_code}"
    error_syscall="$(extract_npm_error_syscall "$log")"
    [[ -n "$error_syscall" ]] && echo "  npm syscall: ${error_syscall}"
    error_errno="$(extract_npm_error_errno "$log")"
    [[ -n "$error_errno" ]] && echo "  npm errno: ${error_errno}"
    debug_log="$(extract_npm_debug_log_path "$log" || true)"
    [[ -n "$debug_log" ]] && echo "  npm debug log: ${debug_log}"
    first_error="$(extract_first_npm_error_line "$log")"
    [[ -n "$first_error" ]] && echo "  First npm error: ${first_error}"
}

# ─── npm conflict cleanup ───
cleanup_npm_xopc_paths() {
    local npm_root=""
    npm_root="$(npm root -g 2>/dev/null || true)"
    if [[ -z "$npm_root" || "$npm_root" != *node_modules* ]]; then
        return 1
    fi
    rm -rf "$npm_root"/.xopc-* "$npm_root"/@xopcai 2>/dev/null || true
}

extract_xopc_conflict_path() {
    local log="$1"
    local path=""
    path="$(sed -n 's/.*File exists: //p' "$log" | head -n1)"
    if [[ -z "$path" ]]; then
        path="$(sed -n 's/.*EEXIST: file already exists, //p' "$log" | head -n1)"
    fi
    if [[ -n "$path" ]]; then
        echo "$path"
        return 0
    fi
    return 1
}

cleanup_xopc_bin_conflict() {
    local bin_path="$1"
    if [[ -z "$bin_path" || ( ! -e "$bin_path" && ! -L "$bin_path" ) ]]; then
        return 1
    fi
    local npm_bin=""
    npm_bin="$(npm_global_bin_dir 2>/dev/null || true)"
    if [[ -n "$npm_bin" && "$bin_path" != "$npm_bin/${BIN_NAME}" ]]; then
        case "$bin_path" in
            "/opt/homebrew/bin/${BIN_NAME}"|"/usr/local/bin/${BIN_NAME}")
                ;;
            *)
                return 1
                ;;
        esac
    fi
    if [[ -L "$bin_path" ]]; then
        local target=""
        target="$(readlink "$bin_path" 2>/dev/null || true)"
        if [[ "$target" == *"/node_modules/@xopcai/"* || "$target" == *"/node_modules/${BIN_NAME}/"* ]]; then
            rm -f "$bin_path"
            ui_info "Removed stale ${BIN_NAME} symlink at ${bin_path}"
            return 0
        fi
        return 1
    fi
    local backup=""
    backup="${bin_path}.bak-$(date +%Y%m%d-%H%M%S)"
    if mv "$bin_path" "$backup"; then
        ui_info "Moved existing ${BIN_NAME} binary to ${backup}"
        return 0
    fi
    return 1
}

# ─── npm global bin dir ───
npm_global_bin_dir() {
    local bin_dir=""
    bin_dir="$(npm config get prefix 2>/dev/null || true)"
    if [[ -n "$bin_dir" ]]; then
        echo "${bin_dir}/bin"
        return 0
    fi
    echo "/usr/local/bin"
}

# ─── npm permissions fix ───
fix_npm_permissions() {
    [[ "$OS" != "linux" ]] && return 0

    local npm_prefix=""
    npm_prefix="$(npm config get prefix 2>/dev/null || true)"
    npm_prefix="${npm_prefix:-/usr/local}"

    local npm_bin="${npm_prefix}/bin"
    local npm_lib="${npm_prefix}/lib/node_modules"

    if [[ -w "$npm_bin" && -w "$npm_lib" ]]; then
        return 0
    fi

    local alt_prefix="${HOME}/.npm-global"
    ui_info "npm global directory is not writable; redirecting to ${alt_prefix}"
    mkdir -p "${alt_prefix}"
    npm config set prefix "${alt_prefix}"

    local shell_rc
    for shell_rc in "${HOME}/.bashrc" "${HOME}/.zshrc" "${HOME}/.profile"; do
        if [[ -f "$shell_rc" ]]; then
            if ! grep -q 'npm-global' "$shell_rc" 2>/dev/null; then
                printf '\n# npm global (set by xopc installer)\nexport PATH="%s/bin:$PATH"\n' "$alt_prefix" >> "$shell_rc"
            fi
        fi
    done

    prepend_path_dir "${alt_prefix}/bin"
    ui_success "npm prefix → ${alt_prefix}"
}

# ─── PATH helpers ───
prepend_path_dir() {
    local dir="$1"
    case ":$PATH:" in
        *":${dir}:"*) ;;
        *) export PATH="${dir}:${PATH}" ;;
    esac
}

persist_shell_path_prepend() {
    local dir="$1"
    local label="${2:-xopc}"

    local -a rc_files=()
    case "${SHELL:-}" in
        */zsh)  rc_files=("${HOME}/.zshrc") ;;
        */bash) rc_files=("${HOME}/.bashrc" "${HOME}/.bash_profile") ;;
        *)      rc_files=("${HOME}/.profile") ;;
    esac
    [[ -f "${HOME}/.profile" ]] && rc_files+=("${HOME}/.profile")

    local marker="# ${label} PATH"
    local line="export PATH=\"${dir}:\$PATH\"  ${marker}"

    local f
    for f in "${rc_files[@]}"; do
        [[ -f "$f" ]] || continue
        if grep -Fq "$marker" "$f" 2>/dev/null; then
            continue
        fi
        printf '\n%s\n' "$line" >> "$f"
    done
}

warn_shell_path_missing_dir() {
    local dir="$1"
    case ":${PATH}:" in
        *":${dir}:"*) return 0 ;;
    esac
    ui_warn "${dir} is not in your PATH — restart your shell or run:"
    echo "  export PATH=\"${dir}:\$PATH\""
}

# ─── Node.js version management ───
get_node_version_raw() {
    node --version 2>/dev/null || true
}

get_node_major() {
    local raw="$1"
    raw="${raw#v}"
    echo "${raw%%.*}"
}

get_node_minor() {
    local raw="$1"
    raw="${raw#v}"
    raw="${raw#*.}"
    echo "${raw%%.*}"
}

is_node_version_ok() {
    local raw=""
    raw="$(get_node_version_raw)"
    [[ -z "$raw" ]] && return 1
    local major minor
    major="$(get_node_major "$raw")"
    minor="$(get_node_minor "$raw")"
    if [[ "$major" -gt "$NODE_MIN_MAJOR" ]]; then
        return 0
    fi
    if [[ "$major" -eq "$NODE_MIN_MAJOR" && "$minor" -ge "$NODE_MIN_MINOR" ]]; then
        return 0
    fi
    return 1
}

check_node() {
    if command -v node >/dev/null 2>&1; then
        local raw major
        raw="$(get_node_version_raw)"
        major="$(get_node_major "$raw")"
        if is_node_version_ok; then
            ui_success "Node.js ${raw} detected"
            return 0
        fi
        ui_warn "Node.js ${raw} found but >= v${NODE_MIN_VERSION} is required"
    fi
    return 1
}

install_node() {
    ui_info "Installing Node.js v${NODE_DEFAULT_MAJOR}"

    if [[ "$OS" == "macos" ]]; then
        if command -v brew >/dev/null 2>&1; then
            run_quiet_step "Installing Node.js via Homebrew" brew install "node@${NODE_DEFAULT_MAJOR}"
            brew link --overwrite "node@${NODE_DEFAULT_MAJOR}" 2>/dev/null || true
        else
            ui_info "Installing Node.js via official installer"
            run_remote_bash "https://nodejs.org/dist/latest-v${NODE_DEFAULT_MAJOR}.x/node-v${NODE_DEFAULT_MAJOR}.*-darwin-$(uname -m | sed 's/x86_64/x64/;s/arm64/arm64/').tar.gz"
        fi
    elif [[ "$OS" == "linux" ]]; then
        if is_alpine_linux; then
            run_quiet_step "Installing Node.js" maybe_sudo apk add --no-cache "nodejs>=22" npm
        elif is_arch_linux; then
            run_quiet_step "Installing Node.js" maybe_sudo pacman -Sy --noconfirm nodejs npm
        elif command -v apt-get >/dev/null 2>&1; then
            require_sudo
            ui_info "Setting up NodeSource repository"
            local setup_script
            setup_script="$(mktempfile)"
            download_file "https://deb.nodesource.com/setup_${NODE_DEFAULT_MAJOR}.x" "$setup_script"
            maybe_sudo -E bash "$setup_script"
            run_quiet_step "Installing Node.js" apt_get_install nodejs
        elif command -v dnf >/dev/null 2>&1; then
            require_sudo
            local setup_script
            setup_script="$(mktempfile)"
            download_file "https://rpm.nodesource.com/setup_${NODE_DEFAULT_MAJOR}.x" "$setup_script"
            maybe_sudo -E bash "$setup_script"
            run_quiet_step "Installing Node.js" maybe_sudo dnf install -y nodejs
        elif command -v yum >/dev/null 2>&1; then
            require_sudo
            local setup_script
            setup_script="$(mktempfile)"
            download_file "https://rpm.nodesource.com/setup_${NODE_DEFAULT_MAJOR}.x" "$setup_script"
            maybe_sudo -E bash "$setup_script"
            run_quiet_step "Installing Node.js" maybe_sudo yum install -y nodejs
        else
            ui_error "Cannot install Node.js automatically on this distribution"
            echo "  Please install Node.js >= ${NODE_MIN_VERSION} manually."
            exit 1
        fi
    fi

    if ! command -v node >/dev/null 2>&1; then
        ui_error "Node.js installation failed"
        exit 1
    fi

    if ! is_node_version_ok; then
        ui_error "Node.js $(get_node_version_raw) installed but >= v${NODE_MIN_VERSION} required"
        exit 1
    fi

    ui_success "Node.js $(get_node_version_raw) installed"
}

# ─── nvm / fnm / volta PATH promotion ───
load_nvm_for_node_detection() {
    if [[ -n "${NVM_DIR:-}" && -s "${NVM_DIR}/nvm.sh" ]]; then
        # shellcheck disable=SC1091
        . "${NVM_DIR}/nvm.sh" --no-use >/dev/null 2>&1 || true
        return 0
    fi
    local nvm_dir="${HOME}/.nvm"
    if [[ -s "${nvm_dir}/nvm.sh" ]]; then
        export NVM_DIR="$nvm_dir"
        # shellcheck disable=SC1091
        . "${nvm_dir}/nvm.sh" --no-use >/dev/null 2>&1 || true
        return 0
    fi
    return 1
}

find_node_binaries_in_version_manager_dirs() {
    local -a results=()

    # nvm
    local nvm_dir="${NVM_DIR:-${HOME}/.nvm}"
    if [[ -d "$nvm_dir/versions/node" ]]; then
        local d
        for d in "$nvm_dir/versions/node"/v*/bin; do
            [[ -x "$d/node" ]] && results+=("$d/node")
        done
    fi

    # fnm
    local fnm_dir="${FNM_DIR:-${HOME}/.local/share/fnm}"
    if [[ -d "$fnm_dir/node-versions" ]]; then
        local d
        for d in "$fnm_dir/node-versions"/v*/installation/bin; do
            [[ -x "$d/node" ]] && results+=("$d/node")
        done
    fi

    # volta
    local volta_home="${VOLTA_HOME:-${HOME}/.volta}"
    if [[ -d "$volta_home/tools/image/node" ]]; then
        local d
        for d in "$volta_home/tools/image/node"/*/bin; do
            [[ -x "$d/node" ]] && results+=("$d/node")
        done
    fi

    if [[ ${#results[@]} -gt 0 ]]; then
        printf '%s\n' "${results[@]}"
    fi
}

promote_supported_node_binary() {
    if is_node_version_ok; then
        return 0
    fi

    local best_major=0
    local best_minor=0
    local best_dir=""

    while IFS= read -r node_bin; do
        local raw major minor
        raw="$("$node_bin" --version 2>/dev/null || true)"
        [[ -z "$raw" ]] && continue
        major="$(get_node_major "$raw")"
        minor="$(get_node_minor "$raw")"
        if [[ "$major" -lt "$NODE_MIN_MAJOR" ]]; then
            continue
        fi
        if [[ "$major" -eq "$NODE_MIN_MAJOR" && "$minor" -lt "$NODE_MIN_MINOR" ]]; then
            continue
        fi
        if [[ "$major" -gt "$best_major" || ( "$major" -eq "$best_major" && "$minor" -gt "$best_minor" ) ]]; then
            best_major="$major"
            best_minor="$minor"
            best_dir="$(dirname "$node_bin")"
        fi
    done < <(find_node_binaries_in_version_manager_dirs)

    if [[ -n "$best_dir" ]]; then
        prepend_path_dir "$best_dir"
        ui_info "Promoted Node.js v${best_major}.${best_minor} from ${best_dir}"
        return 0
    fi
    return 1
}

ensure_default_node_active_shell() {
    local nvm_dir="${NVM_DIR:-${HOME}/.nvm}"
    if [[ -s "$nvm_dir/nvm.sh" ]] && command -v nvm >/dev/null 2>&1; then
        local raw=""
        raw="$(get_node_version_raw)"
        local major=""
        major="$(get_node_major "$raw")"
        if nvm alias default "v${major}" >/dev/null 2>&1; then
            ui_info "Set nvm default → v${major}"
        fi
    fi
}

# ─── pnpm ───
ensure_pnpm() {
    if command -v pnpm >/dev/null 2>&1; then
        return 0
    fi

    ui_info "Enabling pnpm via corepack"
    if command -v corepack >/dev/null 2>&1; then
        corepack enable pnpm 2>/dev/null || maybe_sudo corepack enable pnpm 2>/dev/null || true
    fi

    if command -v pnpm >/dev/null 2>&1; then
        return 0
    fi

    ui_info "Installing pnpm via npm"
    npm install -g pnpm >/dev/null 2>&1 || true

    if ! command -v pnpm >/dev/null 2>&1; then
        ui_error "Failed to install pnpm"
        return 1
    fi
    ui_success "pnpm installed"
}

ensure_pnpm_binary_for_scripts() {
    if command -v pnpm >/dev/null 2>&1; then
        return 0
    fi
    if command -v corepack >/dev/null 2>&1; then
        corepack enable pnpm 2>/dev/null || maybe_sudo corepack enable pnpm 2>/dev/null || true
    fi
    command -v pnpm >/dev/null 2>&1
}

# ─── Git install ───
install_git() {
    if command -v git >/dev/null 2>&1; then
        return 0
    fi

    ui_info "Installing git"
    if [[ "$OS" == "macos" ]]; then
        if command -v brew >/dev/null 2>&1; then
            run_quiet_step "Installing git" brew install git
        else
            xcode-select --install 2>/dev/null || true
        fi
    elif [[ "$OS" == "linux" ]]; then
        require_sudo
        if command -v apt-get >/dev/null 2>&1; then
            apt_get_update
            run_quiet_step "Installing git" apt_get_install git
        elif command -v pacman >/dev/null 2>&1; then
            run_quiet_step "Installing git" maybe_sudo pacman -Sy --noconfirm git
        elif command -v apk >/dev/null 2>&1; then
            run_quiet_step "Installing git" maybe_sudo apk add --no-cache git
        elif command -v dnf >/dev/null 2>&1; then
            run_quiet_step "Installing git" maybe_sudo dnf install -y git
        fi
    fi

    if ! command -v git >/dev/null 2>&1; then
        ui_error "Git installation failed"
        exit 1
    fi
    ui_success "Git installed"
}

# ─── Duplicate install detection ───
find_xopc_global_installs() {
    local -a found=()
    local -a real_paths=()

    _add_if_unique() {
        local label="$1"
        local dir="$2"
        [[ -d "$dir" ]] || return 0
        local real=""
        real="$(cd "$dir" 2>/dev/null && pwd -P)" || real="$dir"
        local existing
        for existing in "${real_paths[@]:-}"; do
            [[ "$existing" == "$real" ]] && return 0
        done
        real_paths+=("$real")
        found+=("${label}:${dir}")
    }

    # npm global
    local npm_root=""
    npm_root="$(npm root -g 2>/dev/null || true)"
    if [[ -n "$npm_root" ]]; then
        _add_if_unique "npm-global" "$npm_root/@xopcai/xopc"
    fi

    # nvm
    local nvm_dir="${NVM_DIR:-${HOME}/.nvm}"
    if [[ -d "$nvm_dir/versions/node" ]]; then
        local d
        for d in "$nvm_dir/versions/node"/v*/lib/node_modules/@xopcai/xopc; do
            _add_if_unique "nvm" "$d"
        done
    fi

    # fnm
    local fnm_dir="${FNM_DIR:-${HOME}/.local/share/fnm}"
    if [[ -d "$fnm_dir/node-versions" ]]; then
        local d
        for d in "$fnm_dir/node-versions"/v*/installation/lib/node_modules/@xopcai/xopc; do
            _add_if_unique "fnm" "$d"
        done
    fi

    # volta
    local volta_home="${VOLTA_HOME:-${HOME}/.volta}"
    if [[ -d "$volta_home" ]]; then
        local d
        for d in "$volta_home/tools/image/packages/@xopcai/xopc"/*/; do
            _add_if_unique "volta" "$d"
        done
    fi

    if [[ ${#found[@]} -gt 0 ]]; then
        printf '%s\n' "${found[@]}"
    fi
}

warn_duplicate_xopc_global_installs() {
    local -a installs=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && installs+=("$line")
    done < <(find_xopc_global_installs)

    if [[ ${#installs[@]} -le 1 ]]; then
        return 0
    fi

    ui_warn "Multiple xopc global installations detected:"
    local i
    for i in "${installs[@]}"; do
        echo "  - ${i}"
    done
    echo "  Consider removing duplicates with: npm uninstall -g ${PACKAGE_NAME}"
}

# ─── Resolve xopc binary ───
resolve_xopc_bin() {
    local bin=""

    # 1. Current PATH
    bin="$(command -v "$BIN_NAME" 2>/dev/null || true)"
    if [[ -n "$bin" && -x "$bin" ]]; then
        echo "$bin"
        return 0
    fi

    # 2. npm global bin
    local npm_bin=""
    npm_bin="$(npm_global_bin_dir 2>/dev/null || true)"
    if [[ -n "$npm_bin" && -x "$npm_bin/$BIN_NAME" ]]; then
        echo "$npm_bin/$BIN_NAME"
        return 0
    fi

    # 3. ~/.local/bin (git mode)
    if [[ -x "${HOME}/.local/bin/$BIN_NAME" ]]; then
        echo "${HOME}/.local/bin/$BIN_NAME"
        return 0
    fi

    return 1
}

# ─── Detect checkout ───
detect_xopc_checkout() {
    local dir="${1:-.}"
    if [[ -f "${dir}/package.json" ]]; then
        if grep -q '"@xopcai/xopc"' "${dir}/package.json" 2>/dev/null; then
            echo "$dir"
            return 0
        fi
    fi
    return 1
}

# ─── Interactive method selection ───
choose_install_method_interactive() {
    if [[ -n "$INSTALL_METHOD" && "$INSTALL_METHOD" != "auto" ]]; then
        return 0
    fi

    local detected_checkout=""
    detected_checkout="$(detect_xopc_checkout "." 2>/dev/null || true)"
    if [[ -n "$detected_checkout" ]]; then
        INSTALL_METHOD="git"
        GIT_DIR="$(cd "$detected_checkout" && pwd -P)"
        ui_info "Detected xopc checkout at ${GIT_DIR}; using git mode"
        return 0
    fi

    if [[ "${NO_PROMPT:-0}" == "1" ]]; then
        INSTALL_METHOD="npm"
        return 0
    fi

    if [[ -n "$GUM" ]] && gum_is_tty; then
        local gum_err
        gum_err="$(mktempfile)"
        local choice=""
        choice="$("$GUM" choose --header="Choose install method:" \
            "npm  — recommended (npm install -g ${PACKAGE_NAME})" \
            "git  — from source (git clone + build)" \
            2>"$gum_err" || true)"
        if is_gum_raw_mode_failure "$gum_err"; then
            GUM=""
        fi
        case "$choice" in
            npm*) INSTALL_METHOD="npm" ;;
            git*) INSTALL_METHOD="git" ;;
            *) INSTALL_METHOD="npm" ;;
        esac
        return 0
    fi

    if has_controlling_tty; then
        echo ""
        echo "Choose install method:"
        echo "  1) npm  — recommended (npm install -g ${PACKAGE_NAME})"
        echo "  2) git  — from source (git clone + build)"
        echo ""
        local answer=""
        read -r -p "Choice [1]: " answer </dev/tty
        case "$answer" in
            2|git) INSTALL_METHOD="git" ;;
            *) INSTALL_METHOD="npm" ;;
        esac
        return 0
    fi

    INSTALL_METHOD="npm"
}

# ─── npm install path ───
is_xopc_source_package_install_spec() {
    local spec="$1"
    case "$spec" in
        "@xopcai/xopc"|"@xopcai/xopc@"*) return 0 ;;
    esac
    return 1
}

install_xopc_npm() {
    local spec="$XOPC_VERSION"
    local is_source_pkg=false

    if is_xopc_source_package_install_spec "$spec"; then
        is_source_pkg=true
    elif [[ "$USE_BETA" == "1" ]]; then
        spec="${PACKAGE_NAME}@beta"
        is_source_pkg=true
    elif [[ -z "$spec" || "$spec" == "latest" ]]; then
        spec="${PACKAGE_NAME}@latest"
        is_source_pkg=true
    elif [[ "$spec" == *"/"* || "$spec" == *".tgz" || "$spec" == *".tar.gz" ]]; then
        is_source_pkg=false
    else
        spec="${PACKAGE_NAME}@${spec}"
        is_source_pkg=true
    fi

    local log
    log="$(mktempfile)"

    local max_retries=2
    local attempt=0
    local success=false

    while [[ "$attempt" -lt "$max_retries" ]]; do
        attempt=$((attempt + 1))

        if npm_install_with_registry_fallback "$spec" "$log"; then
            success=true
            break
        fi

        local error_code=""
        error_code="$(extract_npm_error_code "$log")"

        # EEXIST / ENOTEMPTY — bin conflict recovery
        if [[ "$error_code" == "EEXIST" || "$error_code" == "ENOTEMPTY" ]]; then
            local conflict_path=""
            conflict_path="$(extract_xopc_conflict_path "$log" || true)"
            if [[ -n "$conflict_path" ]]; then
                ui_info "Resolving file conflict at ${conflict_path}"
                if cleanup_xopc_bin_conflict "$conflict_path"; then
                    ui_info "Retrying npm install"
                    continue
                fi
            fi
            cleanup_npm_xopc_paths
            ui_info "Retrying npm install"
            continue
        fi

        # Build tools missing
        if auto_install_build_tools_for_npm_failure "$log"; then
            ui_info "Retrying npm install with build tools"
            continue
        fi

        break
    done

    if [[ "$success" != "true" ]]; then
        print_npm_failure_diagnostics "$spec" "$log"
        exit 1
    fi

    ui_success "xopc installed via npm"
}

# ─── Git install path ───
install_xopc_from_git() {
    local target_dir="$GIT_DIR"
    local ref="$XOPC_VERSION"
    [[ -z "$ref" || "$ref" == "latest" ]] && ref="main"
    if [[ "$USE_BETA" == "1" ]]; then
        ref="beta"
    fi

    install_git
    ensure_pnpm

    if [[ -d "$target_dir/.git" ]]; then
        if [[ "$GIT_UPDATE" == "1" ]]; then
            ui_info "Updating existing checkout at ${target_dir}"
            (cd "$target_dir" && git fetch --all --prune 2>/dev/null)
            (cd "$target_dir" && git checkout "$ref" 2>/dev/null || git checkout "origin/${ref}" 2>/dev/null || true)
            (cd "$target_dir" && git pull --ff-only 2>/dev/null || true)
        else
            ui_info "Using existing checkout at ${target_dir} (--no-git-update)"
        fi
    else
        ui_info "Cloning ${REPO_URL} into ${target_dir}"
        run_quiet_step "Cloning repository" git clone --depth 1 --branch "$ref" "$REPO_URL" "$target_dir"
    fi

    cd "$target_dir"

    # Export Electron mirrors if using CN registry
    if [[ "$REGISTRY_SOURCE" == "auto-mirror" || "$REGISTRY_SOURCE" == "explicit-cn" ]]; then
        export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
        export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
        ui_info "Set Electron mirrors for git build"
    fi

    local pnpm_args=()
    if [[ -n "$NPM_REGISTRY" && "$NPM_REGISTRY" != "https://registry.npmjs.org" ]]; then
        pnpm_args+=(--registry "$NPM_REGISTRY")
    fi

    run_quiet_step "Installing dependencies" pnpm install --frozen-lockfile "${pnpm_args[@]}"
    run_quiet_step "Building xopc" pnpm run build

    # Create wrapper script
    local wrapper_dir="${HOME}/.local/bin"
    mkdir -p "$wrapper_dir"
    local wrapper="${wrapper_dir}/${BIN_NAME}"

    cat > "$wrapper" <<WRAPPER
#!/bin/bash
exec node "${target_dir}/dist/src/cli/bin.js" "\$@"
WRAPPER
    chmod +x "$wrapper"

    prepend_path_dir "$wrapper_dir"
    persist_shell_path_prepend "$wrapper_dir" "xopc"

    ui_success "xopc installed from git (${target_dir})"
    ui_info "Binary wrapper: ${wrapper}"
}

# ─── Verification ───
verify_installation() {
    local xopc_bin=""
    xopc_bin="$(resolve_xopc_bin || true)"
    if [[ -z "$xopc_bin" ]]; then
        ui_error "xopc binary not found after installation"
        return 1
    fi

    ui_info "Verifying: ${xopc_bin}"

    local version_output=""
    version_output="$("$xopc_bin" --version 2>/dev/null || true)"
    if [[ -z "$version_output" ]]; then
        ui_error "xopc --version returned empty"
        return 1
    fi
    ui_success "Version: ${version_output}"

    local help_output=""
    help_output="$("$xopc_bin" --help 2>/dev/null || true)"
    if [[ -z "$help_output" ]]; then
        ui_warn "xopc --help returned empty (non-critical)"
    fi

    ui_success "Verification passed"
}

# ─── First run hint ───
print_first_run_hint() {
    echo ""
    ui_section "Try one of:"
    echo "  xopc tui --local                  # embedded agent, no gateway"
    echo "  xopc gateway                      # web console + messengers"
    echo "  xopc agent -i                     # classic interactive CLI"
    echo ""
}

print_upgrade_hint() {
    echo ""
    ui_celebrate "🎉 xopc has been upgraded!"
    echo ""
    echo "  Run 'xopc --version' to verify."
    echo ""
}

# ─── Registry auto-detect (P1) ───
NPM_REGISTRY=""
REGISTRY_SOURCE=""

detect_npm_registry() {
    # 1. Explicit override (CLI or env)
    if [[ -n "${XOPC_NPM_REGISTRY:-}" ]]; then
        NPM_REGISTRY="$XOPC_NPM_REGISTRY"
        REGISTRY_SOURCE="explicit"
        return 0
    fi

    # 2. --cn force mirror
    if [[ "${USE_CN:-0}" == "1" ]]; then
        NPM_REGISTRY="https://registry.npmmirror.com"
        REGISTRY_SOURCE="explicit-cn"
        return 0
    fi

    # 3. opt-out auto-detect
    if [[ "${XOPC_NO_REGISTRY_AUTODETECT:-0}" == "1" ]]; then
        NPM_REGISTRY="https://registry.npmjs.org"
        REGISTRY_SOURCE="default"
        return 0
    fi

    # 4. User npm already configured a non-default registry
    local user_registry=""
    if command -v npm >/dev/null 2>&1; then
        user_registry="$(npm config get registry 2>/dev/null || true)"
        user_registry="${user_registry%/}"
    fi
    if [[ -n "$user_registry" \
       && "$user_registry" != "https://registry.npmjs.org" \
       && "$user_registry" != "undefined" ]]; then
        NPM_REGISTRY="$user_registry"
        REGISTRY_SOURCE="user-npmrc"
        return 0
    fi

    # 5. CN soft hint (timezone + locale)
    local cn_hint=0
    local tz_link=""
    tz_link="$(readlink /etc/localtime 2>/dev/null || true)"
    case "$tz_link" in
        *Asia/Shanghai*|*Asia/Chongqing*|*Asia/Urumqi*|*Asia/Hong_Kong*) cn_hint=1 ;;
    esac
    if [[ "$cn_hint" -eq 0 ]]; then
        local lang_val="${LANG:-}${LC_ALL:-}"
        case "$lang_val" in
            *zh_CN*|*zh_HK*) cn_hint=1 ;;
        esac
    fi

    if [[ "$cn_hint" -eq 0 ]]; then
        NPM_REGISTRY="https://registry.npmjs.org"
        REGISTRY_SOURCE="default"
        return 0
    fi

    # 6. Latency probe (dual HEAD, 1.2s timeout)
    local npmjs_time mirror_time
    npmjs_time="$(curl -fsS --max-time 1.2 -o /dev/null -w "%{time_total}" \
        https://registry.npmjs.org/-/ping 2>/dev/null || echo "9999")"
    mirror_time="$(curl -fsS --max-time 1.2 -o /dev/null -w "%{time_total}" \
        https://registry.npmmirror.com/-/ping 2>/dev/null || echo "9999")"

    # npmjs failed/timeout/slow >= 2× mirror → use mirror
    local use_mirror=0
    if [[ "$npmjs_time" == "9999" && "$mirror_time" != "9999" ]]; then
        use_mirror=1
    elif [[ "$npmjs_time" != "9999" && "$mirror_time" != "9999" ]]; then
        use_mirror=$(awk "BEGIN { print ($npmjs_time >= $mirror_time * 2) ? 1 : 0 }")
    fi

    if [[ "$use_mirror" -eq 1 ]]; then
        NPM_REGISTRY="https://registry.npmmirror.com"
        REGISTRY_SOURCE="auto-mirror"
        ui_info "Auto-detected slow link to npmjs — using mirror: https://registry.npmmirror.com"
        ui_info "Override: --registry <url>  or  XOPC_NPM_REGISTRY=<url>"
    else
        NPM_REGISTRY="https://registry.npmjs.org"
        REGISTRY_SOURCE="default"
    fi
}

# ─── npm install with registry fallback (P1) ───
npm_install_with_registry_fallback() {
    local spec="$1"
    local log="$2"
    shift 2

    # Build registry args
    local -a registry_args=()
    if [[ -n "$NPM_REGISTRY" && "$NPM_REGISTRY" != "https://registry.npmjs.org" ]]; then
        registry_args+=(--registry "$NPM_REGISTRY")
    fi

    if run_npm_global_install "$spec" "$log" "${registry_args[@]}"; then
        return 0
    fi

    # If registry was mirror and install failed → retry with npmjs
    if [[ "$REGISTRY_SOURCE" == "auto-mirror" || "$REGISTRY_SOURCE" == "explicit-cn" ]]; then
        ui_warn "Mirror install failed; retrying with registry.npmjs.org"
        if run_npm_global_install "$spec" "$log" --registry "https://registry.npmjs.org"; then
            return 0
        fi
    fi

    return 1
}

# ─── Gateway service refresh (P2) ───
is_gateway_daemon_loaded() {
    local xopc_cmd="$1"
    [[ -z "$xopc_cmd" ]] && return 1

    local status_json=""
    status_json="$(bounded_probe_output "xopc gateway status" \
        "$xopc_cmd" gateway status --json --no-probe 2>/dev/null || true)"
    [[ -z "$status_json" ]] && return 1

    printf '%s' "$status_json" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
if (!raw) process.exit(1);
try {
  const data = JSON.parse(raw);
  process.exit(data?.service?.loaded ? 0 : 1);
} catch { process.exit(1); }
' >/dev/null 2>&1
}

refresh_gateway_service_if_loaded() {
    local xopc_cmd=""
    xopc_cmd="$(resolve_xopc_bin 2>/dev/null || true)"
    [[ -z "$xopc_cmd" ]] && return 0

    is_gateway_daemon_loaded "$xopc_cmd" || return 0

    ui_info "Refreshing loaded gateway service"
    run_quiet_step "Refreshing gateway service" \
        "$xopc_cmd" gateway service install --force || {
        ui_warn "Gateway service refresh failed; continuing"; return 0; }
    ui_success "Gateway service metadata refreshed"

    run_quiet_step "Restarting gateway service" \
        "$xopc_cmd" gateway restart || {
        ui_warn "Gateway service restart failed; continuing"; return 0; }
    ui_success "Gateway service restarted"

    # Final status check (human-readable)
    run_quiet_step "Probing gateway status" \
        "$xopc_cmd" gateway status --no-probe || true
}

# ─── Argument parsing (P3) ───
INSTALL_METHOD=""
XOPC_VERSION="${XOPC_VERSION:-latest}"
USE_BETA="${XOPC_BETA:-0}"
GIT_DIR="${XOPC_GIT_DIR:-${HOME}/xopc}"
GIT_UPDATE="${XOPC_GIT_UPDATE:-1}"
NO_PROMPT="${XOPC_NO_PROMPT:-0}"
VERIFY_INSTALL="${XOPC_VERIFY_INSTALL:-0}"
DRY_RUN="${XOPC_DRY_RUN:-0}"
NO_ONBOARD="${XOPC_NO_ONBOARD:-0}"
VERBOSE="${XOPC_VERBOSE:-0}"
USE_CN="${XOPC_USE_CN:-0}"
NPM_LOGLEVEL="warn"
NPM_SILENT_FLAG=""

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --install-method|--method)
                INSTALL_METHOD="${2:-}"
                shift 2
                ;;
            --version)
                XOPC_VERSION="${2:-latest}"
                shift 2
                ;;
            --beta)
                USE_BETA=1
                shift
                ;;
            --git-dir|--dir)
                GIT_DIR="${2:-${HOME}/xopc}"
                shift 2
                ;;
            --no-git-update)
                GIT_UPDATE=0
                shift
                ;;
            --registry)
                XOPC_NPM_REGISTRY="${2:-}"
                shift 2
                ;;
            --cn)
                USE_CN=1
                shift
                ;;
            --no-onboard)
                NO_ONBOARD=1
                shift
                ;;
            --no-prompt)
                NO_PROMPT=1
                shift
                ;;
            --verify)
                VERIFY_INSTALL=1
                shift
                ;;
            --dry-run)
                DRY_RUN=1
                shift
                ;;
            --verbose)
                VERBOSE=1
                NPM_LOGLEVEL="verbose"
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                ui_warn "Unknown option: $1"
                shift
                ;;
        esac
    done

    # Validate install method
    case "${INSTALL_METHOD}" in
        npm|git|"") ;;
        auto) INSTALL_METHOD="" ;;
        *)
            ui_error "Unknown install method: ${INSTALL_METHOD}"
            echo "  Valid methods: npm, git"
            exit 1
            ;;
    esac

    # Apply env overrides for method
    if [[ -z "$INSTALL_METHOD" && -n "${XOPC_INSTALL_METHOD:-}" ]]; then
        INSTALL_METHOD="$XOPC_INSTALL_METHOD"
    fi
}

show_usage() {
    cat <<'USAGE'
xopc installer for macOS + Linux

Usage: curl -fsSL https://xopc.ai/install.sh | bash

Options:
  --install-method, --method npm|git
  --version <version|tag|spec>          (default: latest)
  --beta                                (best-effort; falls back to latest if no beta tag)
  --git-dir, --dir <path>               (default: ~/xopc)
  --no-git-update
  --registry <url>                      explicit npm registry override
  --cn                                  force npmmirror (skip auto-detect)
  --no-onboard
  --no-prompt
  --verify
  --dry-run
  --verbose
  --help, -h

Env vars (mirror CLI flags, all prefixed XOPC_):
  XOPC_INSTALL_METHOD, XOPC_VERSION, XOPC_BETA, XOPC_GIT_DIR, XOPC_GIT_UPDATE,
  XOPC_NO_PROMPT, XOPC_VERIFY_INSTALL, XOPC_DRY_RUN, XOPC_NO_ONBOARD, XOPC_VERBOSE,
  XOPC_NPM_REGISTRY, XOPC_NO_REGISTRY_AUTODETECT, XOPC_USE_CN
USAGE
}

# ─── main() ───
main() {
    parse_args "$@"

    # Bootstrap gum for pretty UI
    bootstrap_gum_temp || true

    # Banner
    print_installer_banner
    print_gum_status

    # OS check
    detect_os_or_die

    # Windows bail
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || -n "${OS_WINDOWS:-}" ]]; then
        ui_error "Windows detected — use npm instead:"
        echo "  npm install -g ${PACKAGE_NAME}"
        exit 1
    fi

    # Detect downloader
    detect_downloader

    # Detect checkout in PWD
    local detected_checkout=""
    detected_checkout="$(detect_xopc_checkout "." 2>/dev/null || true)"

    # Choose install method
    choose_install_method_interactive

    # Configure install stages
    configure_install_stage_total

    # Detect npm registry early so plan can display it
    detect_npm_registry

    # Show plan
    show_install_plan "$detected_checkout"

    # Dry-run exit
    if [[ "$DRY_RUN" == "1" ]]; then
        ui_info "Dry run — exiting"
        exit 0
    fi

    # ─── Stage 1: Preparing environment ───
    ui_stage "Preparing environment"

    load_nvm_for_node_detection || true

    if ! check_node; then
        promote_supported_node_binary || true
        if ! check_node; then
            install_node
        fi
    fi

    ensure_default_node_active_shell

    # Registry info (already detected above)
    if [[ "$REGISTRY_SOURCE" == "user-npmrc" ]]; then
        ui_info "Using npm registry from user config: ${NPM_REGISTRY}"
    elif [[ "$REGISTRY_SOURCE" == "auto-mirror" ]]; then
        : # Already printed by detect_npm_registry
    elif [[ "$REGISTRY_SOURCE" == "explicit" || "$REGISTRY_SOURCE" == "explicit-cn" ]]; then
        ui_info "Using explicit registry: ${NPM_REGISTRY}"
    fi

    # ─── Stage 2: Installing xopc ───
    ui_stage "Installing xopc"

    local is_upgrade=false
    if resolve_xopc_bin >/dev/null 2>&1; then
        is_upgrade=true
    fi

    if [[ "$INSTALL_METHOD" == "git" ]]; then
        install_xopc_from_git
    else
        fix_npm_permissions
        install_xopc_npm
    fi

    # ─── Stage 3: Finalizing setup ───
    ui_stage "Finalizing setup"

    local xopc_bin=""
    xopc_bin="$(resolve_xopc_bin || true)"
    if [[ -z "$xopc_bin" ]]; then
        ui_error "xopc binary not found after installation"
        echo "  You may need to restart your shell or check PATH."
        exit 1
    fi

    # Duplicate install check
    warn_duplicate_xopc_global_installs

    # PATH checks
    if [[ "$INSTALL_METHOD" != "git" ]]; then
        local npm_bin_dir=""
        npm_bin_dir="$(npm_global_bin_dir 2>/dev/null || true)"
        if [[ -n "$npm_bin_dir" ]]; then
            warn_shell_path_missing_dir "$npm_bin_dir"
        fi
    fi

    # Gateway service refresh (P2)
    refresh_gateway_service_if_loaded

    # ─── Stage 4 (optional): Verification ───
    if [[ "$VERIFY_INSTALL" == "1" ]]; then
        ui_stage "Verifying installation"
        verify_installation
    fi

    # ─── Completion ───
    echo ""
    if [[ "$is_upgrade" == "true" ]]; then
        print_upgrade_hint
    else
        local version_output=""
        version_output="$("$xopc_bin" --version 2>/dev/null || true)"
        ui_celebrate "🎉 xopc ${version_output:-} installed!"
        print_first_run_hint
    fi

    show_footer_links
    echo ""
}

main "$@"
