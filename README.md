# Aptos Devflow Toolkit

Aptos-native developer workflow validation, fixture harness and reproducible CI toolkit.

## Install

For repository testing:

```bash
npm install
```

For CLI package usage:

```bash
npm install @idoa/aptos-devflow-cli
```

## Try In 60 Seconds

Primary proof command for users:

```bash
npx devflow doctor
```

Fallback if you want to execute the package by name:

```bash
npx @idoa/aptos-devflow-cli doctor
```

Primary repository proof command:

```bash
npm run doctor
```

Full repository verification:

```bash
npm run verify
```

Testing flow:

- `npx devflow doctor`
  - main CLI proof command
  - validates environment
  - runs sample validation
  - runs the fixture harness
  - writes standardized reports
- `npm run doctor`
  - same proof flow from the repository root
- `npm run verify`
  - full repository verification
  - runs build, tests, lint and doctor

Expected result:

- PASS or WARN lines for environment checks
- PASS or FAIL lines for validate and harness steps
- generated artifacts in `reports/`

Generated artifacts:

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`

## Proof Of Functionality

The doctor and verify commands validate the workflow and generate standardized reports.

## Playground

The playground is a separate quick try in browser for offline validation and report preview. It is not the primary proof command.

```bash
cd playground
npm install
npm run dev
```

What it shows:

- Validate for JSON payload checks
- Fixtures for sample runs
- Report for loading `report.json`

More details: [docs/playground.md](./docs/playground.md)

## CI Integration

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
