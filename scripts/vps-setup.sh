#!/usr/bin/env bash
# vps-setup.sh — one-time server hardening + directory setup
# Run ONCE on a fresh Ubuntu VPS as root or with sudo
# Usage: sudo bash vps-setup.sh shazfakraft.in your@email.com
set -euo pipefail

DOMAIN="${1:-shazfakraft.in}"
EMAIL="${2:-your@email.com}"
APP_DIR="/var/www/shazfakraft"
DEPLOY_USER="deploy"

echo "================================================================"
echo " Shazfa Kraft — VPS Setup"
echo " Domain: $DOMAIN | Email: $EMAIL"
echo "================================================================"

# ── System update ─────────────────────────────────────────
apt-get update -y && apt-get upgrade -y

# ── Create dedicated deploy user (non-root) ───────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
  echo "  Created user: $DEPLOY_USER"
fi

# ── SSH hardening ─────────────────────────────────────────
mkdir -p /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh
touch /home/$DEPLOY_USER/.ssh/authorized_keys
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh

SSHD_CONF="/etc/ssh/sshd_config"
cp "$SSHD_CONF" "${SSHD_CONF}.bak"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/'             "$SSHD_CONF"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONF"
sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/'                 "$SSHD_CONF"
sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/'                    "$SSHD_CONF"
systemctl reload sshd
echo "  SSH hardened (root login + password auth disabled)"

# ── UFW firewall ──────────────────────────────────────────
apt-get install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable
echo "  UFW enabled — 22, 80, 443 open"

# ── Fail2ban ──────────────────────────────────────────────
apt-get install -y fail2ban
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s
EOF
systemctl enable --now fail2ban
echo "  Fail2ban configured"

# ── Docker (skip if already installed) ───────────────────
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$DEPLOY_USER"
  echo "  Docker installed"
fi

# ── Certbot (SSL) ─────────────────────────────────────────
apt-get install -y certbot
echo "  Certbot installed"

# ── App directory structure ───────────────────────────────
mkdir -p "$APP_DIR"/{logs/app,logs/nginx,nginx/conf.d}
chown -R $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"
echo "  App directory created: $APP_DIR"

# ── Auto SSL renewal cron ─────────────────────────────────
(crontab -l 2>/dev/null; \
 echo "0 3 * * * certbot renew --quiet && docker exec shazfakraft-nginx nginx -s reload") \
 | sort -u | crontab -
echo "  SSL auto-renewal cron added"

echo ""
echo "================================================================"
echo " NEXT STEPS"
echo "================================================================"
echo ""
echo " 1. Copy your SSH public key to the deploy user:"
echo "    ssh-copy-id -i ~/.ssh/id_ed25519.pub $DEPLOY_USER@<VPS_IP>"
echo ""
echo " 2. Create and fill .env on the VPS:"
echo "    cp $APP_DIR/.env.example $APP_DIR/.env && nano $APP_DIR/.env"
echo ""
echo " 3. Issue SSL certificate (stop containers first if running):"
echo "    certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN \\"
echo "      --email $EMAIL --agree-tos --non-interactive"
echo ""
echo " 4. Uncomment the HTTPS block in:"
echo "    $APP_DIR/nginx/conf.d/shazfakraft.conf"
echo "    (replace shazfakraft.in with $DOMAIN)"
echo ""
echo " 5. Start the stack:"
echo "    cd $APP_DIR && docker compose up -d"
echo ""
echo " 6. Add GitHub repository secrets (see DEPLOYMENT.md)"
echo "================================================================"
