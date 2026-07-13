#!/bin/bash
# ==============================================
#  贵州民族大学机器人实验室 - 阿里云服务器部署
#  用法: bash deploy.sh
# ==============================================
set -e

# ---- 配置 ----
GITHUB_REPO="https://github.com/3084589601/RL-SPME.git"
PROJECT_DIR="/opt/robot-lab"
SERVICE_NAME="robot-lab"
DOMAIN="gzmzdxwlyjdgcxysys.top"
SERVER_IP="121.196.228.254"
SERVER_PORT=3000

# 颜色
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
step()  { echo -e "\n${CYAN}>>> [${1}]${NC} ${2}"; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }

echo ""
echo -e "${GREEN}========================================"
echo "  贵州民族大学机器人实验室"
echo "  阿里云服务器部署"
echo -e "========================================${NC}"
echo -e "  服务器: ${YELLOW}$SERVER_IP${NC}"
echo -e "  域名:   ${YELLOW}$DOMAIN${NC}"
echo ""

# ========================================
step "1/8" "检查 Node.js..."
# ========================================
if ! command -v node &>/dev/null; then
    warn "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - 2>/dev/null || true
    sudo apt-get install -y nodejs 2>/dev/null || sudo yum install -y nodejs 2>/dev/null || {
        echo "Node.js 安装失败，请手动安装 (≥ 18)"
        exit 1
    }
fi
ok "Node.js $(node -v)"

# ========================================
step "2/8" "拉取代码..."
# ========================================
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git pull origin master
    ok "已更新到最新"
else
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown -R $USER:$USER "$PROJECT_DIR"
    git clone "$GITHUB_REPO" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    ok "代码已克隆"
fi

# ========================================
step "3/8" "安装依赖..."
# ========================================
npm install
ok "依赖已安装"

# ========================================
step "4/8" "配置环境变量..."
# ========================================
if [ ! -f .env ]; then
    cp .env.example .env
fi

# 生成随机密钥
RANDOM_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$RANDOM_SECRET\"|" .env
sed -i "s|AUTH_TRUST_HOST=.*|AUTH_TRUST_HOST=true|" .env

# 设置域名
PUBLIC_URL="http://$DOMAIN"
sed -i "s|PUBLIC_URL=.*|PUBLIC_URL=\"$PUBLIC_URL\"|" .env
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"$PUBLIC_URL\"|" .env
ok "域名: $PUBLIC_URL"

# AUTH_TRUST_HOST 必须为 true（反向代理）
if ! grep -q "AUTH_TRUST_HOST=true" .env; then
    echo "AUTH_TRUST_HOST=true" >> .env
fi

# ========================================
step "5/8" "构建项目..."
# ========================================
npm run build
ok "构建完成"

# ========================================
step "6/8" "配置 systemd 服务..."
# ========================================
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << SYSTEMD
[Unit]
Description=Robot Lab Website
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which node) node_modules/.bin/next start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=$SERVER_PORT

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    ok "服务运行中"
else
    echo "  ⚠ 服务可能未启动，检查 journalctl -u $SERVICE_NAME"
fi

# ========================================
step "7/8" "配置 Nginx 反向代理..."
# ========================================

# 安装 nginx
if ! command -v nginx &>/dev/null; then
    warn "安装 Nginx..."
    sudo apt-get update -qq && sudo apt-get install -y nginx 2>/dev/null || \
    sudo yum install -y epel-release && sudo yum install -y nginx 2>/dev/null || true
fi

sudo tee /etc/nginx/conf.d/$SERVICE_NAME.conf > /dev/null << 'NGINX'
server {
    listen 80;
    server_name gzmzdxwlyjdgcxysys.top 121.196.228.254;

    client_max_body_size 3g;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX

# 删除默认站点（避免冲突）
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf 2>/dev/null || true

# 测试并重载 nginx
if nginx -t 2>/dev/null; then
    sudo systemctl enable nginx 2>/dev/null || true
    sudo systemctl restart nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
    ok "Nginx 已配置"
else
    warn "Nginx 配置有误，请检查"
fi

# ========================================
step "8/8" "防火墙..."
# ========================================

# 阿里云安全组提示
echo ""
echo -e "  ${YELLOW}⚠ 请确保以下端口在阿里云安全组已放行：${NC}"
echo -e "    控制台: https://ecs.console.aliyun.com → 安全组 → 入方向"
echo -e "    TCP 80   (HTTP)   授权: 0.0.0.0/0"
echo -e "    TCP 3000 (备用)   授权: 0.0.0.0/0"

# 尝试放行本地防火墙
for port in 80 3000; do
    if command -v firewall-cmd &>/dev/null; then
        sudo firewall-cmd --add-port=$port/tcp --permanent 2>/dev/null || true
    elif command -v ufw &>/dev/null; then
        sudo ufw allow $port/tcp 2>/dev/null || true
    elif command -v iptables &>/dev/null; then
        sudo iptables -C INPUT -p tcp --dport $port -j ACCEPT 2>/dev/null || \
        sudo iptables -I INPUT -p tcp --dport $port -j ACCEPT 2>/dev/null || true
    fi
done
command -v firewall-cmd &>/dev/null && sudo firewall-cmd --reload 2>/dev/null || true
ok "防火墙已配置"

# ========================================
echo ""
echo -e "${GREEN}========================================"
echo "  部署完成！"
echo -e "========================================${NC}"
echo ""
echo -e "  🌐 访问地址:   ${YELLOW}http://$DOMAIN${NC}"
echo -e "  🌐 备用地址:   ${YELLOW}http://$SERVER_IP${NC}"
echo -e "  📁 项目目录:   ${YELLOW}$PROJECT_DIR${NC}"
echo ""
echo -e "  ${CYAN}管理命令:${NC}"
echo -e "  查看状态:  systemctl status $SERVICE_NAME"
echo -e "  重启服务:  systemctl restart $SERVICE_NAME"
echo -e "  查看日志:  journalctl -u $SERVICE_NAME -f"
echo -e "  更新部署:  cd $PROJECT_DIR && bash deploy.sh"
echo ""
echo -e "  ${CYAN}⚠ 还需手动完成（阿里云控制台）:${NC}"
echo -e "  1. DNS 解析: 万网控制台 → DNS 解析 → 添加 A 记录"
echo -e "     @  →  $SERVER_IP"
echo -e "     www → $SERVER_IP"
echo -e "  2. 安全组放行 80 端口（见上方）"
echo ""
echo -e "${GREEN}========================================${NC}"
