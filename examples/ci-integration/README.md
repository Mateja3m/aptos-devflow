# CI Integration Example

This example shows the minimal command set that a vendor neutral CI runner executes.

```bash
npm install
npm run build
devflow validate examples/tx-payloads/fixtures/valid-transfer/fixture.json -j
devflow harness run examples/tx-payloads/fixtures -o reports
```

Generated artifacts:

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`
