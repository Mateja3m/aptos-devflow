# @idoa/report

Formatting and parsing helpers for Aptos Devflow reports.

## What It Does

- formats report JSON deterministically
- formats CI friendly summary text
- parses generated report files back into typed objects

## Install

```bash
npm install @idoa/report
```

## Use

```ts
import { formatReportJson, formatSummaryText, parseReport } from "@idoa/report";

const json = formatReportJson(report);
const summary = formatSummaryText(report);
const parsed = parseReport(json);
```

## Docs

- [Root README](../../README.md)
- [Report format](../../docs/report-format.md)
