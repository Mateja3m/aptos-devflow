# Validator Rules

## Offline rules

- `aptos.tx.payload-shape`
- `aptos.tx.entry-function-args`
- `aptos.tx.gas-sanity`
- `aptos.network.config`
- `aptos.event.decoding`

Offline mode never makes RPC calls. Online only checks are reported as skipped warnings in offline mode.

## Node only rules

- `aptos.move.compile`
- `aptos.network.online-check`

`aptos.move.compile` shells out to Aptos CLI when a Move package path is validated.

## Profiles

- `strict` treats warnings as fixture failures
- `relaxed` allows warnings without failing the fixture
