# @idoa/core

Shared types and helpers for Aptos Devflow packages.

## What It Does

- defines validator input and result models
- defines fixture and report types
- provides deterministic summary helpers
- provides stable JSON serialization helpers

## Install

```bash
npm install @idoa/core
```

## Use

```ts
import { summarizeDetail, stableStringify } from "@idoa/core";

const summary = summarizeDetail(results, "strict");
const json = stableStringify(summary);
```

## Docs

- [Root README](../../README.md)
- [Report Format](../../docs/report-format.md)
