# Shazfa Kraft — Production Deployment Guide

## Table of Contents
1. [Files Created](#files-created)
2. [GitHub Secrets](#github-secrets)
3. [VPS First-Time Setup](#vps-first-time-setup)
4. [SSL Certificate](#ssl-certificate)
5. [How the Deploy Flow Works](#how-the-deploy-flow-works)
6. [Rollback](#rollback)
7. [Logs](#logs)
8. [Scaling Later](#scaling-later)

---

## Files Created

```
shazfakraft/
├── Dockerfile                        ← Multi-stage Next.js build
├── .dockerignore                     ← Excludes secrets/node_modules from image
├── docker-compose.yml                ← App + Nginx containers
├── .env.example                      ← Template — copy to .env on VPS
├── nginx/
│   ├── nginx.conf                    ← Main nginx config (gzip, rate limiting, headers)
│   └── conf.d/
│       └── shazfakraft.conf          ← Virtual host (HTTP→HTTPS + SSL block)
├── .github/
│   └── workflows/
│       └── deploy.yml                ← GitHub Actions CI/CD pipeline
└── scripts/
    ├── deploy.sh                     ← Build + restart containers on VPS
    ├── healthcheck.sh                ← Verify deployment success
    ├── rollback.sh                   ← Revert to previous image
    └── vps-setup.sh                  ← One-time server hardening
```

---

## GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name   | Value                                            | Example              |
|---------------|--------------------------------------------------|----------------------|
| `VPS_HOST`    | VPS IP address or hostname                       | `123.45.67.89`       |
| `VPS_USER`    | SSH username on the VPS                          | `deploy`             |
| `VPS_SSH_KEY` | Full content of your **private** SSH key file    | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `VPS_PORT`    | SSH port (usually 22)                            | `22`                 |

### Generate the SSH key pair

```bash
# On your LOCAL machine (not the VPS)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/shazfakraft_deploy

# Copy PUBLIC key to VPS deploy user
ssh-copy-id -i ~/.ssh/shazfakraft_deploy.pub deploy@<VPS_IP>

# Print PRIVATE key — paste its full content into VPS_SSH_KEY secret
cat ~/.ssh/shazfakraft_deploy
```

---

## VPS First-Time Setup

```bash
# 1. Upload and run the setup script (as root)
scp scripts/vps-setup.sh root@<VPS_IP>:/tmp/
ssh root@<VPS_IP> "bash /tmp/vps-setup.sh shazfakraft.in your@email.com"

# 2. Log in as the deploy user going forward
ssh deploy@<VPS_IP>

# 3. Create .env on the VPS
cp /var/www/shazfakraft/.env.example /var/www/shazfakraft/.env
nano /var/www/shazfakraft/.env
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
```

---

## SSL Certificate

Run **before** starting Docker containers (Certbot needs port 80 free):

```bash
# On VPS as root/sudo
certbot certonly --standalone \
  -d shazfakraft.in \
  -d www.shazfakraft.in \
  --email your@email.com \
  --agree-tos \
  --non-interactive
```

Then **uncomment the HTTPS server block** in
`/var/www/shazfakraft/nginx/conf.d/shazfakraft.conf`
and replace every instance of `shazfakraft.in` with your real domain.

SSL auto-renews via cron at 3 AM daily (configured by `vps-setup.sh`).

---

## How the Deploy Flow Works

```
Developer pushes to main
        │
        ▼
GitHub Actions runner starts
        │
        ├── 1. Checkout source code
        ├── 2. Configure SSH with VPS_SSH_KEY secret
        ├── 3. rsync source → VPS:/var/www/shazfakraft/
        │      (excludes .env, node_modules, .next, logs)
        ├── 4. SSH → VPS → scripts/deploy.sh
        │      ├── Verify .env exists
        │      ├── docker compose build --no-cache app
        │      │      (NEXT_PUBLIC_* vars passed as build-args)
        │      ├── docker compose up -d --remove-orphans
        │      ├── Wait for container healthcheck to pass (max 2 min)
        │      └── docker image prune -f
        └── 5. SSH → VPS → scripts/healthcheck.sh
               ├── docker compose ps
               ├── HTTP check on app:3000
               └── HTTP check on nginx /health
```

**Why `NEXT_PUBLIC_*` vars need `--build-arg`:**
Next.js inlines all `NEXT_PUBLIC_*` variables into the static JS bundle at compile time.
They must be available during `docker build`, not just at runtime.
That is why `deploy.sh` sources `.env` and passes them as `--build-arg`.

**Near-zero-downtime:**
`docker compose up -d` starts the new container and only routes traffic once
its healthcheck passes (~30 s). The old container keeps running until the new
one is healthy.

---

## Rollback

```bash
# SSH into VPS
ssh deploy@<VPS_IP>

# Revert to the previous Docker image
bash /var/www/shazfakraft/scripts/rollback.sh
```

For a code-level rollback (trigger a clean redeploy from a previous commit):

```bash
# On your local machine
git revert HEAD          # creates a new revert commit
git push origin main     # triggers the deploy workflow automatically
```

---

## Logs

```bash
# Live container logs
docker logs -f shazfakraft-app
docker logs -f shazfakraft-nginx

# On-disk log files (persisted by Docker volume mounts)
tail -f /var/www/shazfakraft/logs/nginx/access.log
tail -f /var/www/shazfakraft/logs/nginx/error.log
```

---

## Scaling Later

**Vertical** — Upgrade your VPS plan. No config changes needed.

**Horizontal (multiple app replicas):**
1. Enable Docker Swarm: `docker swarm init`
2. Add to `docker-compose.yml` under `app`:
   ```yaml
   deploy:
     replicas: 2
   ```
3. Nginx upstream already round-robins between instances.

**CDN** — Point Cloudflare (free tier) at your domain to cache static
`/_next/static` assets globally and absorb traffic spikes without touching
your VPS.
