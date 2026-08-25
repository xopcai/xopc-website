#!/bin/bash

# ============================================
# xopc-website 部署脚本
# ============================================

set -e

# 从环境变量读取配置（需要先 source ~/.zshrc 或手动设置）
SERVER="${XOPC_SERVER}"
REMOTE_DIR="${XOPC_REMOTE_DIR:-/var/www/xopc-website}"
DOMAINS_ARRAY=(${XOPC_DOMAINS:-xopc.ai xopc.io})

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
    check_command "pnpm"
    
    echo_step "检查远程服务器..."
    ssh -o ConnectTimeout=10 $SERVER "echo 'SSH OK'" || { echo_error "无法连接到服务器"; exit 1; }

    # 1. 本地构建检查
    echo ""
    echo_step "步骤 1/3: 本地构建检查..."
    pnpm install --frozen-lockfile
    pnpm build
    echo -e "${GREEN}✓ 本地构建检查通过${NC}"

    # 2. 仅同步源码；.next 含平台相关的原生模块引用，必须在服务器构建
    echo ""
    echo_step "步骤 2/3: 同步文件到服务器..."
    rsync -avz --delete \
        --include='.env.example' \
        --exclude='.env*' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.git' \
        --exclude='.data' \
        --exclude='.xopc-share-staging' \
        --exclude='.DS_Store' \
        --exclude='*.log' \
        --exclude='*.tsbuildinfo' \
        --exclude='.npmrc' \
        ./ $SERVER:$REMOTE_DIR/
    echo -e "${GREEN}✓ 同步完成${NC}"

    # 3. 在目标平台构建并重启 PM2
    echo ""
    echo_step "步骤 3/3: 服务器构建并重启应用..."
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

        # 原生依赖（如 better-sqlite3）必须在 Linux 上生成 Next.js 构建产物
        echo "构建应用..."
        pnpm build

        # SQLite 应用数据与发布 / CloakBrowser 缓存目录
        mkdir -p .data .data/cloakbrowser-cache

        # 重启 PM2（使用 ecosystem，避免 pnpm/Next.js 参数转发歧义）
        echo "重启应用..."
        pm2 startOrReload ecosystem.config.cjs --update-env
        pm2 save

        echo "✓ 应用已重启"
REMOTE_SCRIPT
    echo -e "${GREEN}✓ 服务器构建并重启成功${NC}"

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
