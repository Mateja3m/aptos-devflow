# Transaction Payload Fixtures

This fixture set exercises deterministic offline validation for Aptos transaction payloads.

- Five fixtures are expected to pass in relaxed profile.
- Five fixtures are expected to fail in strict profile.
- Every fixture lives in its own folder with a short README and `fixture.json`.

Run:

```bash
devflow harness run examples/tx-payloads/fixtures
```
