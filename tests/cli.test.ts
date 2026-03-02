import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { runCli } from "../packages/cli/src/index.js";

function createIO() {
  const output: string[] = [];
  return {
    io: {
      out(message: string) {
        output.push(message);
      },
      err(message: string) {
        output.push(message);
      },
    },
    output,
  };
}

describe("cli integration", () => {
  test("validate command returns zero for valid relaxed fixture json", async () => {
    const { io, output } = createIO();
    const exitCode = await runCli(
      [
        "validate",
        "examples/tx-payloads/fixtures/valid-transfer/fixture.json",
        "-j",
      ],
      io,
    );
    expect(exitCode).toBe(0);
    expect(output.join("\n")).toContain('"status": "pass"');
  });

  test("harness run writes summary text", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "devflow-harness-"));
    const { io, output } = createIO();
    const exitCode = await runCli(
      ["harness", "run", "examples/tx-payloads/fixtures", "-o", outputDir],
      io,
    );
    expect(exitCode).toBe(0);
    expect(output.join("\n")).toContain("top_failures=");
  });

  test("report view prints summary", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "devflow-report-"));
    const { io } = createIO();
    await runCli(
      ["harness", "run", "examples/tx-payloads/fixtures", "-o", outputDir],
      io,
    );
    const sink = createIO();
    const exitCode = await runCli(
      ["report", "view", path.join(outputDir, "devflow-report.json")],
      sink.io,
    );
    expect(exitCode).toBe(0);
    expect(sink.output.join("\n")).toContain("generated_at=");
  });

  test("doctor runs outside the repository and writes bundled fixture reports", async () => {
    const previousCwd = process.cwd();
    const workDir = await mkdtemp(path.join(tmpdir(), "devflow-doctor-"));
    process.chdir(workDir);
    try {
      const sink = createIO();
      const exitCode = await runCli(["doctor"], sink.io);
      expect(exitCode).toBe(0);
      expect(sink.output.join("\n")).toContain(
        "PASS validate bundled-fixtures/valid-transfer/fixture.json",
      );
      expect(sink.output.join("\n")).toContain("PASS harness bundled-fixtures");
      const summary = await readFile(
        path.join(workDir, "reports", "devflow-summary.txt"),
        "utf8",
      );
      expect(summary).toContain("top_failures=");
    } finally {
      process.chdir(previousCwd);
    }
  });

  test("doctor report output is deterministic when fixed time is provided", async () => {
    const previousCwd = process.cwd();
    const previousFixedTime = process.env.DEVFLOW_FIXED_TIME;
    const workDir = await mkdtemp(
      path.join(tmpdir(), "devflow-deterministic-"),
    );
    process.env.DEVFLOW_FIXED_TIME = "2026-03-02T12:00:00.000Z";
    process.chdir(workDir);
    try {
      const firstSink = createIO();
      expect(await runCli(["doctor"], firstSink.io)).toBe(0);
      const firstReport = await readFile(
        path.join(workDir, "reports", "devflow-report.json"),
        "utf8",
      );
      const firstSummary = await readFile(
        path.join(workDir, "reports", "devflow-summary.txt"),
        "utf8",
      );

      const secondSink = createIO();
      expect(await runCli(["doctor"], secondSink.io)).toBe(0);
      const secondReport = await readFile(
        path.join(workDir, "reports", "devflow-report.json"),
        "utf8",
      );
      const secondSummary = await readFile(
        path.join(workDir, "reports", "devflow-summary.txt"),
        "utf8",
      );

      expect(firstReport).toBe(secondReport);
      expect(firstSummary).toBe(secondSummary);
    } finally {
      if (previousFixedTime) {
        process.env.DEVFLOW_FIXED_TIME = previousFixedTime;
      } else {
        process.env.DEVFLOW_FIXED_TIME = undefined;
      }
      process.chdir(previousCwd);
    }
  });
});
