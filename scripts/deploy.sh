#!/bin/bash

# ============================================
# xopc-website 部署脚本
# ============================================

set -e

# 从环境变量读取配置（需要先 source ~/.zshrc 或手动设置）
SERVER="${XOPC_SERVER}"
REMOTE_DIR="${XOPC_REMOTE_DIR:-/var/www/xopc-website}"
DOMAINS_ARRAY=(${XOPC_DOMAINS:-xopc.ai xopc.io})
BUILD_IMAGE="${XOPC_BUILD_IMAGE:-node:24.14.1-bookworm-slim}"
BUILD_PLATFORM="${XOPC_BUILD_PLATFORM:-linux/amd64}"
LOCAL_BUILD_DIR=""

cleanup_local_build() {
    if [ -n "$LOCAL_BUILD_DIR" ]; then
        rm -rf "$LOCAL_BUILD_DIR"
    fi
}
trap cleanup_local_build EXIT

# 检查必需的环境变量
if [ -z "$SERVER" ]; then
    echo "错误: 请先设置环境变量 XOPC_SERVER"
    echo "在 ~/.zshrc 中添加:"
    echo "  export XOPC_SERVER=\"user@hostname\""
    exit 1
fi

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_step() {
    echo -e "${GREEN}==>${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

echo_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo_error "$1 is not installed"
        exit 1
    fi
}

# 主流程
main() {
    echo "=========================================="
    echo "  xopc-website 部署脚本"
    echo "  服务器: $SERVER"
    echo "  远程目录: $REMOTE_DIR"
    echo "=========================================="
    echo ""

    # 前置检查
    echo_step "检查本地环境..."
    check_command "rsync"
    check_command "ssh"
    check_command "docker"
    
    echo_step "检查远程服务器..."
    ssh -o ConnectTimeout=10 $SERVER "echo 'SSH OK'" || { echo_error "无法连接到服务器"; exit 1; }

    # Build locally for the production platform and path, including native dependencies.
    echo ""
    echo_step "步骤 1/3: 本地 Linux 构建..."
    LOCAL_BUILD_DIR=$(mktemp -d "${TMPDIR:-/tmp}/xopc-website-build.XXXXXX")
    rsync -az \
        --include='.env.example' --exclude='.env*' \
        --exclude='node_modules' --exclude='.next' --exclude='.git' \
        --exclude='.docs' --exclude='.data' --exclude='.xopc-share-staging' \
        --exclude='.zshrc.local' --exclude='.DS_Store' --exclude='*.log' \
        --exclude='*.tsbuildinfo' --exclude='.npmrc' --exclude='build' \
        ./ "$LOCAL_BUILD_DIR/"
    docker run --rm --platform "$BUILD_PLATFORM" \
        -e NEXT_TELEMETRY_DISABLED=1 \
        -v "$LOCAL_BUILD_DIR:$REMOTE_DIR" -w "$REMOTE_DIR" \
        "$BUILD_IMAGE" sh -ec 'corepack enable && corepack prepare pnpm@10.33.0 --activate && pnpm install --frozen-lockfile && pnpm build'
    test -f "$LOCAL_BUILD_DIR/.next/BUILD_ID"
    echo -e "${GREEN}✓ 本地 Linux 构建通过${NC}"

    # Sync source and the matching local Linux build; server state stays in place.
    echo ""
    echo_step "步骤 2/3: 同步文件到服务器..."
    rsync -avz --delete \
        --include='.env.example' \
        --exclude='.env*' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.git' \
        --exclude='.docs' \
        --exclude='.zshrc.local' \
        --exclude='.data' \
        --exclude='.xopc-share-staging' \
        --exclude='.DS_Store' \
        --exclude='*.log' \
        --exclude='*.tsbuildinfo' \
        --exclude='.npmrc' \
        ./ $SERVER:$REMOTE_DIR/
    rsync -az --delete --exclude='cache' \
        "$LOCAL_BUILD_DIR/.next/" "$SERVER:$REMOTE_DIR/.next/"
    rsync -az --delete "$LOCAL_BUILD_DIR/public/blog/" "$SERVER:$REMOTE_DIR/public/blog/"
    echo -e "${GREEN}✓ 源码与本地构建产物同步完成${NC}"

    # 3. Install runtime dependencies and restart PM2 without building on the server.
    echo ""
    echo_step "步骤 3/3: 更新运行依赖并重启应用..."
    ssh $SERVER << REMOTE_SCRIPT
        set -e
        cd $REMOTE_DIR

        # 安装/更新依赖（与 lockfile 一致）
        echo "安装依赖..."
        pnpm install --frozen-lockfile

        # 确保 .env 存在（首次部署时从 .env.example 复制）
        if [ ! -f ".env" ]; then
            if [ -f ".env.example" ]; then
                echo "警告: 服务器上不存在 .env 文件，从 .env.example 复制..."
                cp .env.example .env
            else
                echo "警告: 服务器上不存在 .env，且未找到 .env.example，请手动创建 .env（含 TELEGRAM_* 等）。"
            fi
        fi

        # Only use the uploaded client build. Never compile on the server.
        test -f .next/BUILD_ID

        # SQLite 应用数据与发布 / CloakBrowser 缓存目录
        mkdir -p .data .data/cloakbrowser-cache

        # 每天北京时间 09:00 发送官网数据日报；标记区块便于重复部署时幂等更新。
        NODE_BIN=\$(command -v node)
        CRON_BEGIN="# BEGIN xopc-website analytics report"
        CRON_END="# END xopc-website analytics report"
        EXISTING_CRON=\$(crontab -l 2>/dev/null || true)
        FILTERED_CRON=\$(printf '%s\n' "\$EXISTING_CRON" | sed "/^\$CRON_BEGIN\$/,/^\$CRON_END\$/d")
        {
            printf '%s\n' "\$FILTERED_CRON"
            printf '%s\n' "\$CRON_BEGIN"
            printf '%s\n' "CRON_TZ=Asia/Shanghai"
            printf '%s\n' "0 9 * * * cd $REMOTE_DIR && \$NODE_BIN scripts/send-analytics-report.mjs >> .data/analytics-report.log 2>&1"
            printf '%s\n' "\$CRON_END"
        } | crontab -

        # 重启 PM2（使用 ecosystem，避免 pnpm/Next.js 参数转发歧义）
        echo "重启应用..."
        pm2 startOrReload ecosystem.config.cjs --update-env
        pm2 save

        echo "✓ 应用已重启"
REMOTE_SCRIPT
    echo -e "${GREEN}✓ 本地构建产物已启用，应用重启成功${NC}"

    # 4. 验证
    echo ""
    echo_step "验证部署..."
    sleep 3
    
    all_ok=true
    for domain in "${DOMAINS_ARRAY[@]}"; do
        status=$(curl -sLo /dev/null -w "%{http_code}" https://$domain)
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✓${NC} https://$domain - OK"
        else
            echo -e "${RED}✗${NC} https://$domain - HTTP $status"
            all_ok=false
        fi
    done

    echo ""
    echo "=========================================="
    if [ "$all_ok" = true ]; then
        echo -e "${GREEN}  部署成功！${NC}"
    else
        echo -e "${YELLOW}  部署完成，但部分站点可能有问题${NC}"
    fi
    echo "=========================================="
    echo ""
    echo_step "大文件下载（/api/download/*.zip 等）说明"
    echo "  默认：应用对非 YAML 资源返回 307 到 GitHub，客户端直连 CDN，nginx 只转发重定向。"
    echo "  若必须在服务器上代理大文件，在 .env 设置 RELEASE_DOWNLOAD_PROXY_BINARIES=1，并在 nginx 站点中增加类似配置："
    echo "    location /api/download/ {"
    echo "      proxy_pass http://127.0.0.1:3000;"
    echo "      proxy_http_version 1.1;"
    echo "      proxy_set_header Host \$host;"
    echo "      proxy_set_header X-Real-IP \$remote_addr;"
    echo "      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "      proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "      proxy_buffering off;"
    echo "      proxy_request_buffering off;"
    echo "      proxy_read_timeout 3600s;"
    echo "      send_timeout 3600s;"
    echo "    }"
    echo "  验证（应显示 HTTP 307 且 Location 为 github）："
    echo "    curl -sSI \"https://xopc.ai/api/download/xopc-0.0.29-arm64.zip\" | head -20"
    echo ""
    echo_step "CloakBrowser 下载（/api/cloakbrowser/download/*）说明"
    echo "  经 xopc.ai Node 代理并可选磁盘缓存；nginx 建议对 /api/cloakbrowser/ 关闭 buffering、加大超时（同 /api/download/ 大文件配置）。"
    echo "  验证："
    echo "    curl -sSI \"https://xopc.ai/api/cloakbrowser/download/cloakbrowser-darwin-arm64.tar.gz\" | head -20"
}

# 运行
main "$@"
