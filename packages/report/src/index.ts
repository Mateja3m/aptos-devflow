import type { Report } from "@idoa/core";
import { stableStringify } from "@idoa/core";

export function formatReportJson(report: Report): string {
  return stableStringify(report);
}

export function formatSummaryText(report: Report): string {
  const topFailures = report.details
    .filter((detail) => detail.status === "fail")
    .slice(0, 5)
    .map((detail) => {
      const failedRule =
        detail.results.find((result) => result.status === "fail") ??
        detail.results.find((result) => result.status === "warning");
      return `${detail.target}:${failedRule?.ruleId ?? "none"}`;
    })
    .join(", ");

  return [
    `total=${report.summary.total}`,
    `pass=${report.summary.pass}`,
    `fail=${report.summary.fail}`,
    `warning=${report.summary.warning}`,
    `top_failures=${topFailures || "none"}`,
  ].join("\n");
}

export function parseReport(input: string): Report {
  return JSON.parse(input) as Report;
}
