# CI Setup

The toolkit ships with portable CI templates and one shared shell entrypoint.

## Templates

- `ci-templates/.gitlab-ci.yml`
- `ci-templates/.circleci/config.yml`
- `ci-templates/bitbucket-pipelines.yml`
- `ci-templates/azure-pipelines.yml`
- `ci-templates/ci/run.sh`

## Shared entrypoint

`ci/run.sh` does the following:

- checks Node.js availability
- installs dependencies with npm
- builds packages
- runs `devflow validate`
- runs `devflow harness run`
- writes artifacts into `reports/`

## Init flow

Use:

```bash
node packages/cli/dist/bin/devflow.js init-ci gitlab
```

If no provider is passed, the CLI prompts for one of:

- `gitlab`
- `circle`
- `bitbucket`
- `azure`
- `generic`

## Artifacts

CI should always retain:

- `reports/devflow-report.json`
- `reports/devflow-summary.txt`

## Exit codes

- `0` all expectations satisfied
- `1` validation or fixture expectation failure
- `2` config error such as missing fixture path

## Reading the summary

`reports/devflow-summary.txt` is optimized for log output:

- `total`
- `pass`
- `fail`
- `warning`
- `top_failures`
