export const sharedRunScript = `#!/usr/bin/env sh
set -eu

mkdir -p reports

if command -v node >/dev/null 2>&1; then
  echo "node=\$(node -v)"
else
  echo "Node.js is required"
  exit 2
fi

npm ci || npm install
npm run build
node packages/cli/dist/bin/devflow.js validate examples/tx-payloads/fixtures/valid-transfer/fixture.json -j > reports/devflow-validate.json
node packages/cli/dist/bin/devflow.js harness run examples/tx-payloads/fixtures -o reports
cat reports/devflow-summary.txt
`;

export const ciTemplates: Record<string, { target: string; content: string }> =
  {
    gitlab: {
      target: ".gitlab-ci.yml",
      content: `image: node:20

stages:
  - validate

devflow:
  stage: validate
  script:
    - sh ci/run.sh
  artifacts:
    paths:
      - reports/devflow-report.json
      - reports/devflow-summary.txt
`,
    },
    circle: {
      target: ".circleci/config.yml",
      content: `version: 2.1

jobs:
  devflow:
    docker:
      - image: cimg/node:20.11
    steps:
      - checkout
      - run: mkdir -p ci .circleci reports
      - run: sh ci/run.sh
      - store_artifacts:
          path: reports

workflows:
  devflow:
    jobs:
      - devflow
`,
    },
    bitbucket: {
      target: "bitbucket-pipelines.yml",
      content: `image: node:20

pipelines:
  default:
    - step:
        name: Devflow
        script:
          - sh ci/run.sh
        artifacts:
          - reports/devflow-report.json
          - reports/devflow-summary.txt
`,
    },
    azure: {
      target: "azure-pipelines.yml",
      content: `trigger:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: "20.x"
  - script: sh ci/run.sh
    displayName: Run Devflow
  - publish: reports
    artifact: devflow-reports
`,
    },
    generic: {
      target: "ci/run.sh",
      content: sharedRunScript,
    },
  };
