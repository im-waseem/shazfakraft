#!/usr/bin/env bash
set -euo pipefail

echo "==> Healthcheck"
STATUS=$(docker inspect --format='{{.State.Health.Status}}' shazfakraft-app 2>/dev/null || echo "not found")
echo "   shazfakraft-app: $STATUS"
[ "$STATUS" = "healthy" ] || { echo "ERROR: container not healthy"; exit 1; }

# Check via container-internal port (no host port exposed)
HTTP=$(docker exec shazfakraft-app wget -qO- --server-response http://127.0.0.1:3000/ 2>&1 \
  | grep "HTTP/" | tail -1 | awk '{print $2}')
echo "   internal HTTP: ${HTTP:-no response}"

echo "==> OK"
