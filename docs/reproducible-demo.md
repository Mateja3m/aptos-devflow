# Reproducible Demo

This demo proves the toolkit behavior with deterministic local inputs.

## Steps

1. Install dependencies with `npm install`
2. Build packages with `npm run build`
3. Run `node packages/cli/dist/bin/devflow.js harness run examples/tx-payloads/fixtures -o reports`
4. Inspect `reports/devflow-summary.txt`
5. Inspect `reports/devflow-report.json`

## Expected artifacts

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`

## Why it is reproducible

- fixtures are committed as static JSON
- rule ordering is sorted by rule id
- report serialization is stable
- CI uses one shared shell entrypoint
