# Aptos Devflow Toolkit

Aptos-native developer workflow validation, fixture harness, report generation and portable CI checks.

## What It Is

Aptos Devflow Toolkit gives Aptos teams one repeatable terminal flow for:

- validating Aptos payloads and config
- running fixture based checks
- generating standardized reports
- carrying the same signal into CI

The primary public CLI proof flow is:

```bash
npm install @idoa/aptos-devflow-cli
npx devflow doctor
```

The primary repository proof flow is:

```bash
npm install
npm run doctor
```

The full repository verification flow is:

```bash
npm run verify
```

## Package Map

The package names are intentionally short, so this is the quick map:

- `@idoa/aptos-devflow-cli`
  Command line entrypoint. Runs `doctor`, `validate`, `harness`, `report view` and `init-ci`.
- `@idoa/core`
  Shared types and deterministic helpers used by the rest of the toolkit.
- `@idoa/validator`
  Aptos validation rules for payloads, network config, Move checks and online simulation scaffolding.
- `@idoa/harness`
  Fixture runner that executes validation sets and classifies expected pass or fail outcomes.
- `@idoa/report`
  JSON report and text summary formatting helpers.

## Try In 60 Seconds

```bash
npm install @idoa/aptos-devflow-cli
npx devflow doctor
```

Alternative direct package execution:

```bash
npx @idoa/aptos-devflow-cli doctor
```

`doctor` does the following:

- validates environment readiness
- runs validation against a known sample
- executes the fixture harness
- writes standardized reports into `reports/`

Expected result:

- PASS or WARN lines for environment checks
- PASS or FAIL lines for validate and harness steps
- generated artifacts in `reports/`

Generated artifacts:

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`

## Repository Workflow

Use these commands from the repository root:

```bash
npm install
npm run doctor
npm run verify
```

What they do:

- `npm run doctor`
  Repository proof command. Builds the project and runs the CLI doctor flow.
- `npm run verify`
  Full repository verification. Runs build, tests, lint and doctor.

## Playground

The playground is a separate quick try in browser. It is useful for demoing the validator and report viewer, but it is not the primary proof command.

```
cd playground
npm install
npm run dev
```

What it shows:

- `Validate`
  Paste JSON and run offline browser-safe validator rules.
- `Fixtures`
  Run bundled fixture examples that mirror the terminal harness style.
- `Report`
  Upload an existing `report.json` and inspect summary counts and failures.

More details: [docs/playground.md](./docs/playground.md)

## CI Integration

CI stays vendor neutral and shell based.

- [docs/ci-setup.md](./docs/ci-setup.md)
- [ci-templates/](./ci-templates/)
- `devflow init-ci`

## Docs

- [docs/quickstart.md](./docs/quickstart.md)
- [docs/reproducible-demo.md](./docs/reproducible-demo.md)
- [docs/ci-setup.md](./docs/ci-setup.md)
- [docs/validator-rules.md](./docs/validator-rules.md)
- [docs/report-format.md](./docs/report-format.md)
- [docs/faq.md](./docs/faq.md)
- [docs/playground.md](./docs/playground.md)
