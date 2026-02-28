# @idoa/harness

Deterministic fixture runner for Aptos Devflow.

## What It Does

- loads fixture files from a folder
- runs validation against each fixture
- classifies expected pass and expected fail outcomes
- writes `devflow-report.json` and `devflow-summary.txt`

## Install

```bash
npm install @idoa/harness
```

## Use

```ts
import { runHarness } from "@idoa/harness";

const result = await runHarness({
  fixtureDir: "examples/tx-payloads/fixtures",
  outputDir: "reports"
});

console.log(result.exitCode);
```

## Docs

- [Root README](../../README.md)
- [Reproducible demo](../../docs/reproducible-demo.md)
- [Report format](../../docs/report-format.md)
