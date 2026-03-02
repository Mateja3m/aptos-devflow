# FAQ

## Does this require Aptos CLI?

Only Move compile validation requires Aptos CLI. Offline payload checks and the playground work without it.

## Does offline mode call RPC?

No. Offline mode reports online checks as skipped warnings.

## Where are CI artifacts stored?

In `reports/`.

## Can I publish packages separately?

Yes. Public packages are prepared for scoped publish under `@idoa/*`.

## What is the main local proof command?

Use `npm run doctor` in the repository.

After installing the CLI package, use `npx devflow doctor`.
