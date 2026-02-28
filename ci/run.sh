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
node packages/cli/dist/bin/devflow.js validate examples/tx-payloads/fixtures/valid-transfer/fixture.json -j > reports/devflow-validate.json
node packages/cli/dist/bin/devflow.js harness run examples/tx-payloads/fixtures -o reports
cat reports/devflow-summary.txt
