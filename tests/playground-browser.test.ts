import { describe, expect, test } from "vitest";
import {
  flattenMessages,
  parseUploadedReport,
  validateBrowserInput,
} from "../playground/src/lib/browser.js";
import { invalidSample, validSample } from "../playground/src/lib/samples.js";

describe("playground browser validator", () => {
  test("valid sample creates pass report in relaxed profile", async () => {
    const result = await validateBrowserInput({
      kind: "transaction-payload",
      source: "valid-sample",
      data: validSample,
    });
    expect(result.report.details[0]?.status).toBe("pass");
  });

  test("invalid sample exposes at least one failure message", async () => {
    const result = await validateBrowserInput({
      kind: "transaction-payload",
      source: "invalid-sample",
      data: invalidSample,
    });
    const messages = flattenMessages(result.validation.results);
    expect(messages.some((message) => message.severity === "error")).toBe(true);
  });

  test("uploaded report can be parsed back", async () => {
    const result = await validateBrowserInput({
      kind: "transaction-payload",
      source: "valid-sample",
      data: validSample,
    });
    const parsed = parseUploadedReport(JSON.stringify(result.report));
    expect(parsed.schemaVersion).toBe("1.0.0");
  });
});
