# Aptos Devflow Toolkit

Aptos Devflow Toolkit gives Aptos teams one terminal command for reproducible validation, fixture checks and report generation.

## Install

```bash
npm install
npm run build
```

## Try In 60 Seconds

```bash
npm run verify
```

Primary health check:

```bash
npx devflow doctor
```

Expected output:

```text
PASS environment node=v20.x
PASS environment npm available
PASS environment required paths present
WARN environment aptos CLI missing, Move compile skipped
PASS validate examples/tx-payloads/fixtures/valid-transfer/fixture.json
PASS harness examples/tx-payloads/fixtures
PASS report reports/devflow-report.json
```

Reports:

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`

## Playground

Quick try in browser for offline payload validation and report preview.

```bash
cd playground
npm install
npm run dev
```

What it shows:

- Validate tab for JSON payload checks
- Fixtures tab for sample runs
- Report tab for loading `report.json`

More details: [docs/playground.md](./docs/playground.md)

## CI Integration

- [docs/ci-setup.md](./docs/ci-setup.md)
- [ci-templates/](./ci-templates/)
- `devflow init-ci`

## Documentation

- [docs/quickstart.md](./docs/quickstart.md)
- [docs/reproducible-demo.md](./docs/reproducible-demo.md)
- [docs/ci-setup.md](./docs/ci-setup.md)
- [docs/validator-rules.md](./docs/validator-rules.md)
- [docs/report-format.md](./docs/report-format.md)
- [docs/faq.md](./docs/faq.md)
- [docs/playground.md](./docs/playground.md)
