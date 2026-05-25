#!/usr/bin/env bash
# rollback.sh — revert to the :previous image
# Run on VPS: bash /var/www/shazfakraft/scripts/rollback.sh
set -euo pipefail

APP_DIR="/var/www/shazfakraft"
cd "$APP_DIR"

log() { echo "==> [$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if ! docker image inspect shazfakraft-app:previous &>/dev/null; then
  echo "ERROR: No :previous image found. Redeploy from a known-good commit:"
  echo "  git revert HEAD && git push origin main"
  exit 1
fi

log "Rolling back to :previous image"
docker tag shazfakraft-app:previous shazfakraft-app:latest
docker compose up -d --force-recreate app

RETRIES=12; COUNT=0
until [ "$(docker inspect --format='{{.State.Health.Status}}' shazfakraft-app 2>/dev/null)" = "healthy" ]; do
  COUNT=$((COUNT + 1))
  [ "$COUNT" -ge "$RETRIES" ] && echo "ERROR: Rollback failed healthcheck" && exit 1
  echo "  ... $COUNT/$RETRIES"; sleep 10
done

log "Rollback complete"
