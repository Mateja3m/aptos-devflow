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
    const { io, output } = createIO();
    const exitCode = await runCli(
      ["harness", "run", "examples/tx-payloads/fixtures", "-o", "reports-test"],
      io,
    );
    expect(exitCode).toBe(0);
    expect(output.join("\n")).toContain("top_failures=");
  });

  test("report view prints summary", async () => {
    const { io } = createIO();
    await runCli(
      [
        "harness",
        "run",
        "examples/tx-payloads/fixtures",
        "-o",
        "reports-test-view",
      ],
      io,
    );
    const sink = createIO();
    const exitCode = await runCli(
      ["report", "view", "reports-test-view/devflow-report.json"],
      sink.io,
    );
    expect(exitCode).toBe(0);
    expect(sink.output.join("\n")).toContain("generated_at=");
  });
});
