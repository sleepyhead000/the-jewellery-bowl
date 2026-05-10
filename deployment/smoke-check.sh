#!/usr/bin/env sh
set -eu

BASE_URL="${1:-http://localhost:3000}"

echo "Smoke checking ${BASE_URL}"
curl -fsS "${BASE_URL}/" >/dev/null
curl -fsS "${BASE_URL}/products" >/dev/null
echo "Public smoke checks passed."

