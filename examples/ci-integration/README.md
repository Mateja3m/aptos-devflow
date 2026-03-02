# CI Integration Example

This example shows the minimal command set that a vendor neutral CI runner executes.

```bash
npm install
npm run build
npm run doctor
```

Generated artifacts:

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`

Package usage after publishing the CLI package:

```bash
npm install @idoa/aptos-devflow-cli
npx devflow doctor
```
