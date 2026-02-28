import { describe, expect, test } from "vitest";
import { runRemoteValidate } from "../playground/server/src/index.js";
import { validSample } from "../playground/src/lib/samples.js";

describe("playground remote runner", () => {
  test("validate flow returns report and summary fields", async () => {
    const report = await runRemoteValidate({
      kind: "transaction-payload",
      source: "remote-sample",
      data: validSample,
    });

    expect(report.schemaVersion).toBe("1.0.0");
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.details[0]?.target).toBe("remote-sample");
  });
});
