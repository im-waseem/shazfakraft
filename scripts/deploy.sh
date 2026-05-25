#!/usr/bin/env bash
# deploy.sh — minimal-downtime deploy behind Coolify's Traefik
# Strategy: pre-build the new image while old container is live,
# then do a fast stop → start swap (~3-5s gap on port 3038).
set -euo pipefail

APP_DIR="$HOME/shazfakraft"
cd "$APP_DIR"

log() { echo "==> [$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: .env not found at $APP_DIR/.env"
  exit 1
fi

# Source without -u so missing vars don't crash here
set +u
set -a; source "$APP_DIR/.env"; set +a
set -u

# Validate required vars with clear errors
for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: $var is not set in .env"
    exit 1
  fi
done

# ── 1. Build new image while old container is still serving ──
log "Building new image (old container keeps running)"
docker compose build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --no-cache \
  app

# ── 2. Tag current image as :previous for rollback ───────────
if docker image inspect shazfakraft-app:latest &>/dev/null; then
  docker tag shazfakraft-app:latest shazfakraft-app:previous
fi

# ── 3. Fast swap — minimize the gap on port 3038 ─────────────
log "Swapping container (brief ~3-5s gap)"
docker compose up -d --force-recreate app

# ── 4. Wait for healthcheck ───────────────────────────────────
log "Waiting for container to become healthy"
RETRIES=18
COUNT=0
until [ "$(docker inspect --format='{{.State.Health.Status}}' shazfakraft-app 2>/dev/null)" = "healthy" ]; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$RETRIES" ]; then
    echo "ERROR: Container failed healthcheck"
    echo "── Container status:"
    docker inspect --format='Status={{.State.Status}} ExitCode={{.State.ExitCode}}' shazfakraft-app
    echo "── Last 60 lines of logs:"
    docker logs --tail=60 shazfakraft-app 2>&1
    echo "── Rolling back"
    docker tag shazfakraft-app:previous shazfakraft-app:latest 2>/dev/null || true
    docker compose up -d --force-recreate app
    exit 1
  fi
  echo "  ... $COUNT/$RETRIES"
  sleep 10
done

# ── 5. Prune old images ───────────────────────────────────────
docker image prune -f

log "Deploy complete — running on port 3038"
