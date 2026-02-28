# Contributing

## Prerequisites

- Node.js 18.18 or newer
- npm 10 or newer
- Aptos CLI for Move compile checks

## Local workflow

```bash
npm install
npm run build
npm test
npm run lint
node packages/cli/dist/bin/devflow.js validate examples/tx-payloads
```

## Pull request checklist

- Run `npm run build`
- Run `npm test`
- Run `npm run lint`
- Update docs when behavior changes
- Keep reports deterministic

## Release flow

- Update versions and changelog entries
- Run `npm run release:check`
- Create a tag with `npm run release:tag`
- Publish with `npm run release:publish`
