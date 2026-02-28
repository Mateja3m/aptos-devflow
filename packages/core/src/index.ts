export type Severity = "error" | "warning" | "info";
export type ValidationStatus = "pass" | "fail" | "warning";
export type ValidationMode = "offline" | "online";
export type ProfileName = "strict" | "relaxed";

export interface ValidationMessage {
  code: string;
  message: string;
  severity: Severity;
  path?: string;
}

export interface ValidationResult {
  ruleId: string;
  status: ValidationStatus;
  messages: ValidationMessage[];
  durationMs: number;
  title?: string | undefined;
  description?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface ValidationSummary {
  total: number;
  pass: number;
  fail: number;
  warning: number;
}

export interface ValidatorInput {
  kind:
    | "transaction-payload"
    | "entry-function-call"
    | "move-package"
    | "network-config"
    | "generic-json";
  source: string;
  data: unknown;
  metadata?: Record<string, unknown> | undefined;
}

export interface ValidatorContext {
  mode: ValidationMode;
  profile: ProfileName;
  cwd: string;
  fetchImpl?: typeof fetch | undefined;
  now?: (() => number) | undefined;
}

export interface ValidatorRule {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  offlineCapable: boolean;
  check(
    input: ValidatorInput,
    context: ValidatorContext,
  ): Promise<ValidationResult>;
}

export interface Fixture {
  id: string;
  title: string;
  description: string;
  kind: ValidatorInput["kind"];
  input: unknown;
  expectedStatus: "pass" | "fail";
  profile?: ProfileName;
  mode?: ValidationMode;
  metadata?: Record<string, unknown>;
}

export interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  toolVersion: string;
  mode: ValidationMode;
  profile: ProfileName;
}

export interface ReportDetail {
  fixtureId?: string;
  target: string;
  fixtureExpectedOutcome?: "pass" | "fail";
  summary: ValidationSummary;
  status: "pass" | "fail";
  results: ValidationResult[];
}

export interface Report {
  schemaVersion: "1.0.0";
  generatedAt: string;
  durationMs: number;
  summary: ValidationSummary;
  environment: EnvironmentInfo;
  details: ReportDetail[];
}

export interface HarnessRunResult {
  exitCode: 0 | 1 | 2;
  report: Report;
  summaryText: string;
}

export const profileConfigs: Record<
  ProfileName,
  { treatWarningsAsFailures: boolean }
> = {
  strict: { treatWarningsAsFailures: true },
  relaxed: { treatWarningsAsFailures: false },
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sortMessages(
  messages: ValidationMessage[],
): ValidationMessage[] {
  return [...messages].sort((left, right) => {
    if (left.severity !== right.severity) {
      return left.severity.localeCompare(right.severity);
    }
    if (left.code !== right.code) {
      return left.code.localeCompare(right.code);
    }
    return left.message.localeCompare(right.message);
  });
}

export function summarizeResults(
  results: ValidationResult[],
): ValidationSummary {
  return results.reduce<ValidationSummary>(
    (summary, result) => {
      summary.total += 1;
      summary[result.status] += 1;
      return summary;
    },
    { total: 0, pass: 0, fail: 0, warning: 0 },
  );
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value), null, 2);
}

export function summarizeDetail(
  results: ValidationResult[],
  profile: ProfileName,
): { summary: ValidationSummary; status: "pass" | "fail" } {
  const summary = summarizeResults(results);
  const strict = profileConfigs[profile].treatWarningsAsFailures;
  const status =
    summary.fail > 0 || (strict && summary.warning > 0) ? "fail" : "pass";
  return { summary, status };
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (isRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortValue(value[key]);
        return accumulator;
      }, {});
  }
  return value;
}

export function makeResult(
  ruleId: string,
  status: ValidationStatus,
  startedAt: number,
  messages: ValidationMessage[],
  title?: string | undefined,
  description?: string | undefined,
  metadata?: Record<string, unknown> | undefined,
): ValidationResult {
  return {
    ruleId,
    status,
    durationMs: Math.max(0, Date.now() - startedAt),
    messages: sortMessages(messages),
    title,
    description,
    metadata,
  };
}

export function inferStatus(messages: ValidationMessage[]): ValidationStatus {
  if (messages.some((message) => message.severity === "error")) {
    return "fail";
  }
  if (messages.some((message) => message.severity === "warning")) {
    return "warning";
  }
  return "pass";
}
