# Quickstart

## Prerequisites

- Node.js 18.18 or newer
- npm 10 or newer
- Aptos CLI for Move compile checks

## Install

```bash
npm install
npm run build
```

## Run validation

```bash
node packages/cli/dist/bin/devflow.js validate examples/tx-payloads/fixtures/valid-transfer/fixture.json
```

## Run fixture harness

```bash
node packages/cli/dist/bin/devflow.js harness run examples/tx-payloads/fixtures -o reports
```

## View report

```bash
node packages/cli/dist/bin/devflow.js report view reports/devflow-report.json
```
