# Reproducible Demo

This demo proves the toolkit behavior with deterministic local inputs.

## Steps

1. Install dependencies with `npm install`
2. Run `npm run doctor`
3. Run `npm run verify`
4. Inspect `reports/devflow-summary.txt`
5. Inspect `reports/devflow-report.json`

## Expected artifacts

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`

## Why it is reproducible

- doctor uses committed or bundled static fixtures
- rule ordering is sorted by rule id
- report serialization is stable
- CI uses one shared shell entrypoint
