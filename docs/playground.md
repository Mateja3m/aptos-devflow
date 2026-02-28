# Playground

The playground provides a quick proof that validation and report rendering work.

## Stack

- Vite
- React
- TypeScript
- MUI

The frontend uses Material UI components for tabs, forms, tables, alerts and layout.

## Offline mode

```bash
cd playground
npm install
npm run dev
```

## Online mode with remote runner

Start the server:

```bash
cd playground/server
npm run build
npm start
```

Start the frontend in another shell:

```bash
cd playground
npm run dev
```

Optional env:

- `DEVFLOW_SERVER_PORT`
- `DEVFLOW_RATE_LIMIT`

## Test flow

1. Load the sample valid input
2. Load the sample invalid input
3. Run one fixture from the Fixtures tab
4. Upload a `report.json` file in the Report tab
