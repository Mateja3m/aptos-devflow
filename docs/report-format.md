# Report Format

The report schema lives in `packages/core`.

## Top level fields

- `schemaVersion`
- `generatedAt`
- `durationMs`
- `summary`
- `environment`
- `details`

## Summary

```json
{
  "total": 6,
  "pass": 4,
  "fail": 1,
  "warning": 1
}
```

## Detail item

Each detail contains:

- fixture id when available
- fixture expected outcome when available
- target title
- per fixture summary
- overall fixture status
- full ordered rule results

## Summary artifact

`reports/devflow-summary.txt` contains:

- `total`
- `pass`
- `fail`
- `warning`
- `top_failures`
