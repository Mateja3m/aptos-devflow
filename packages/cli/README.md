# @idoa/cli

Command line entrypoint for Aptos Devflow.

## What It Does

- runs `devflow doctor` for end to end local verification
- validates Aptos payload samples
- runs fixture harness suites
- renders generated reports
- initializes vendor neutral CI templates

## Install

```bash
npm install @idoa/cli
```

## Use

Run the main health check:

```bash
npx devflow doctor
```

Validate one sample:

```bash
npx devflow validate examples/tx-payloads/fixtures/valid-transfer/fixture.json
```

Run the full fixture suite:

```bash
npx devflow harness run examples/tx-payloads/fixtures -o reports
```

## Docs

- [Root README](../../README.md)
- [Quickstart](../../docs/quickstart.md)
- [CI setup](../../docs/ci-setup.md)
- [Report format](../../docs/report-format.md)
