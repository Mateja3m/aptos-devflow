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
- `aptos.tx.simulation`

`aptos.move.compile` shells out to Aptos CLI when a Move package path is validated.

`aptos.tx.simulation` is an online only rule. It calls the Aptos simulate transaction endpoint when `rpcUrl` or `rpcUrlEnv` plus `simulationRequest` are provided in fixture metadata or validator input metadata.

If no RPC configuration is present, the rule reports a skipped warning. Offline mode remains the default deterministic path.

## Profiles

- `strict` treats warnings as fixture failures
- `relaxed` allows warnings without failing the fixture
