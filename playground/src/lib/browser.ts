import {
  type Report,
  type Severity,
  type ValidationResult,
  type ValidatorInput,
  summarizeDetail,
} from "@idoa/core";
import { formatReportJson, parseReport } from "@idoa/report";
import { validateOfflineInput } from "@idoa/validator";

export interface PlaygroundMessageRow {
  ruleId: string;
  severity: Severity;
  message: string;
}

export async function validateBrowserInput(input: ValidatorInput) {
  const validation = await validateOfflineInput(input, {
    profile: "relaxed",
    cwd: "/",
  });
  const detail = summarizeDetail(validation.results, "relaxed");
  const report: Report = {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    durationMs: validation.results.reduce(
      (sum, result) => sum + result.durationMs,
      0,
    ),
    summary: detail.summary,
    environment: {
      nodeVersion: "browser",
      platform: "browser",
      toolVersion: "0.1.0",
      mode: "offline",
      profile: "relaxed",
    },
    details: [
      {
        target: input.source,
        summary: detail.summary,
        status: detail.status,
        results: validation.results,
      },
    ],
  };
  return { validation, report };
}

export function reportToDownload(report: Report): string {
  return formatReportJson(report);
}

export function parseUploadedReport(content: string): Report {
  return parseReport(content);
}

export function flattenMessages(
  results: ValidationResult[],
): PlaygroundMessageRow[] {
  return results.flatMap((result) =>
    result.messages.map((message) => ({
      ruleId: result.ruleId,
      severity: message.severity,
      message: message.message,
    })),
  );
}
