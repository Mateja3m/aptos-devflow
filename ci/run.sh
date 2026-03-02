#!/usr/bin/env sh
set -eu

mkdir -p reports

if command -v node >/dev/null 2>&1; then
  echo "node=$(node -v)"
else
  echo "Node.js 18 or newer is required"
  exit 2
fi

npm ci || npm install
npm run build
npm run doctor:cli
cat reports/devflow-summary.txt
