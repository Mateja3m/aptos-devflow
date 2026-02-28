# FAQ

## Does this require Aptos CLI?

Only Move compile validation requires Aptos CLI. Offline payload checks and the playground work without it.

## Does offline mode call RPC?

No. Offline mode reports online checks as skipped warnings.

## Where are CI artifacts stored?

In `reports/`.

## Can I publish packages separately?

Yes. Packages are prepared for scoped publish under `@idoa/*`.
