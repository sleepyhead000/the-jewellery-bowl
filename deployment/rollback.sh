#!/usr/bin/env sh
set -eu

echo "Restarting services from current images..."
docker compose down
docker compose up -d
docker compose ps
echo "Rollback complete."

