#!/usr/bin/env sh
set -eu

echo "Building and deploying The Jewellery Bowl..."
mkdir -p "${UPLOAD_DIR:-/root/the-jewellery-bowl-uploads}"
cp -n .env.production.example .env.production || true
docker compose build app
docker compose up -d
docker compose ps
echo "Deployment complete."

