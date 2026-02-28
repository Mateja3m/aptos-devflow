# @idoa/validator

Validation engine for Aptos payloads, network config and optional Node checks.

## What It Does

- runs deterministic offline rules in browser or Node
- validates Aptos transaction payload shape
- validates argument layout, gas sanity and network config
- exposes Node only checks for Move compile and online environment checks

## Install

```bash
npm install @idoa/validator
```

## Use

Browser safe validation:

```ts
import { validateOfflineInput } from "@idoa/validator";

const result = await validateOfflineInput({
  kind: "transaction-payload",
  source: "payload.json",
  data: payload
});
```

Node validation:

```ts
import { validateInputNode } from "@idoa/validator/node";

const result = await validateInputNode({
  kind: "move-package",
  source: "examples/move-basic/Move.toml",
  data: {}
});
```

## Docs

- [Root README](../../README.md)
- [Validator rules](../../docs/validator-rules.md)
- [Report format](../../docs/report-format.md)
