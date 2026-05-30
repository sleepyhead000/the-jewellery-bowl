#!/usr/bin/env sh
set -eu

BASE_URL="${1:-http://localhost:3000}"

check_url() {
  url="$1"
  attempt=1
  while [ "$attempt" -le 30 ]; do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi
    sleep 2
    attempt=$((attempt + 1))
  done
  curl -fsS "$url" >/dev/null
}

echo "Smoke checking ${BASE_URL}"
check_url "${BASE_URL}/"
check_url "${BASE_URL}/products"
echo "Public smoke checks passed."
