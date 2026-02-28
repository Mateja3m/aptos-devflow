import { existsSync, mkdirSync, rmSync } from "node:fs";

for (const path of [
  "reports",
  ".release",
  "playground/dist",
  "packages/cli/dist",
  "packages/core/dist",
  "packages/harness/dist",
  "packages/report/dist",
  "packages/validator/dist",
  "playground/server/dist",
]) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
  if (path === "reports" || path === ".release") {
    mkdirSync(path, { recursive: true });
  }
}
