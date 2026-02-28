import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";
import { promisify } from "node:util";
import {
  type Report,
  type ValidationResult,
  type ValidatorInput,
  summarizeDetail,
} from "@idoa/core";
import { runHarness } from "@idoa/harness";
import { formatReportJson, formatSummaryText, parseReport } from "@idoa/report";
import { detectKind, validateOfflineInput } from "@idoa/validator";
import { validateInputNode } from "@idoa/validator/node";
import { ciTemplates, sharedRunScript } from "./templates.js";

const execFileAsync = promisify(execFile);

export interface CliIO {
  out(message: string): void;
  err(message: string): void;
}

const defaultIO: CliIO = {
  out: (message) => stdout.write(`${message}\n`),
  err: (message) => stdout.write(`${message}\n`),
};

function helpText(): string {
  return [
    "Aptos Devflow Toolkit",
    "",
    "Commands:",
    "  devflow doctor",
    "  devflow validate <path-or-url> [-j]",
    "  devflow harness run <fixture-dir> [-o reports]",
    "  devflow report view <report.json>",
    "  devflow init-ci [gitlab|circle|bitbucket|azure|generic]",
    "",
    "Flags:",
    "  -j  print JSON output",
    "  -o  output directory for reports",
  ].join("\n");
}

async function readJsonTarget(pathOrUrl: string): Promise<unknown> {
  if (/^https?:\/\//.test(pathOrUrl)) {
    const response = await fetch(pathOrUrl);
    return response.json();
  }
  const content = await readFile(pathOrUrl, "utf8");
  return JSON.parse(content) as unknown;
}

function parseFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function parseOption(args: string[], flag: string, fallback: string): string {
  const index = args.indexOf(flag);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
}

function statusLine(
  status: "PASS" | "FAIL" | "WARN",
  label: string,
  detail: string,
): string {
  return `${status} ${label} ${detail}`;
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync(command, ["--version"], { timeout: 5_000 });
    return true;
  } catch (error) {
    const execError = error as { code?: string | number };
    return execError.code !== "ENOENT";
  }
}

function environmentFailures(requiredPaths: string[]): string[] {
  return requiredPaths
    .filter((target) => !existsSync(target))
    .map((target) => `Missing required path ${target}.`);
}

async function writeSingleValidationReport(
  results: ValidationResult[],
  target: string,
  outputDir: string,
): Promise<Report> {
  const summary = summarizeDetail(results, "relaxed");
  const report: Report = {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    durationMs: results.reduce((sum, result) => sum + result.durationMs, 0),
    summary: summary.summary,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      toolVersion: "0.1.0",
      mode: "offline",
      profile: "relaxed",
    },
    details: [
      {
        target,
        fixtureExpectedOutcome: "pass",
        summary: summary.summary,
        status: summary.status,
        results,
      },
    ],
  };
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "devflow-report.json"),
    formatReportJson(report),
    "utf8",
  );
  await writeFile(
    path.join(outputDir, "devflow-summary.txt"),
    formatSummaryText(report),
    "utf8",
  );
  return report;
}

async function handleDoctor(io: CliIO): Promise<number> {
  const outputDir = path.join(process.cwd(), "reports");
  const sampleFixturePath = path.join(
    "examples",
    "tx-payloads",
    "fixtures",
    "valid-transfer",
    "fixture.json",
  );
  const fixtureDir = path.join("examples", "tx-payloads", "fixtures");
  const requiredPaths = ["packages", "examples", fixtureDir, sampleFixturePath];
  const topFailures: string[] = [];

  const nodeOk =
    Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10) >= 18;
  io.out(
    statusLine(
      nodeOk ? "PASS" : "FAIL",
      "environment",
      `node=${process.version}`,
    ),
  );

  const npmOk = await commandExists("npm");
  io.out(
    statusLine(
      npmOk ? "PASS" : "FAIL",
      "environment",
      npmOk ? "npm available" : "npm missing in PATH",
    ),
  );

  const missingPathFailures = environmentFailures(requiredPaths);
  io.out(
    statusLine(
      missingPathFailures.length === 0 ? "PASS" : "FAIL",
      "environment",
      missingPathFailures.length === 0
        ? "required paths present"
        : `${missingPathFailures.length} path checks failed`,
    ),
  );
  topFailures.push(...missingPathFailures);

  const aptosOk = await commandExists("aptos");
  io.out(
    statusLine(
      aptosOk ? "PASS" : "WARN",
      "environment",
      aptosOk
        ? "aptos CLI available"
        : "aptos CLI missing, Move compile skipped",
    ),
  );

  if (!nodeOk || !npmOk || missingPathFailures.length > 0) {
    return 2;
  }

  try {
    const sampleFixture = JSON.parse(
      await readFile(sampleFixturePath, "utf8"),
    ) as {
      input: unknown;
      kind: ValidatorInput["kind"];
    };
    const sampleValidation = await validateOfflineInput(
      {
        kind: sampleFixture.kind,
        source: sampleFixturePath,
        data: sampleFixture.input,
      },
      { profile: "relaxed" },
    );
    const validationSummary = summarizeDetail(
      sampleValidation.results,
      "relaxed",
    );
    await writeSingleValidationReport(
      sampleValidation.results,
      sampleFixturePath,
      outputDir,
    );
    io.out(
      statusLine(
        validationSummary.status === "pass" ? "PASS" : "FAIL",
        "validate",
        `${sampleFixturePath}`,
      ),
    );
    if (validationSummary.status !== "pass") {
      topFailures.push(
        ...sampleValidation.results
          .filter((result) => result.status !== "pass")
          .flatMap((result) =>
            result.messages.map(
              (message) => `${result.ruleId}: ${message.message}`,
            ),
          ),
      );
    }

    const harnessResult = await runHarness({ fixtureDir, outputDir });
    io.out(
      statusLine(
        harnessResult.exitCode === 0 ? "PASS" : "FAIL",
        "harness",
        `${fixtureDir}`,
      ),
    );
    io.out(
      statusLine("PASS", "report", path.join("reports", "devflow-report.json")),
    );

    if (harnessResult.exitCode !== 0) {
      topFailures.push(
        ...harnessResult.report.details
          .filter((detail) => detail.status !== detail.fixtureExpectedOutcome)
          .flatMap((detail) =>
            detail.results
              .filter((result) => result.status !== "pass")
              .flatMap((result) =>
                result.messages.map(
                  (message) => `${detail.target}: ${message.message}`,
                ),
              ),
          ),
      );
    }

    io.out("");
    io.out("Summary");
    io.out(
      `environment ${nodeOk && npmOk && missingPathFailures.length === 0 ? "ok" : "fail"}`,
    );
    io.out(`validate ${validationSummary.status === "pass" ? "ok" : "fail"}`);
    io.out(`harness ${harnessResult.exitCode === 0 ? "ok" : "fail"}`);
    io.out("report_path reports/devflow-report.json");

    const failuresToPrint = topFailures.slice(0, 3);
    if (failuresToPrint.length > 0) {
      io.out("top_failures");
      for (const failure of failuresToPrint) {
        io.out(failure);
      }
    }

    if (validationSummary.status !== "pass" || harnessResult.exitCode !== 0) {
      return 1;
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Doctor failed.";
    io.err(statusLine("FAIL", "runtime", message));
    return 2;
  }
}

async function handleValidate(args: string[], io: CliIO): Promise<number> {
  const target = args[0];
  if (!target) {
    io.err("Missing path or URL.");
    return 2;
  }

  try {
    const targetExists = existsSync(target);
    const isMoveToml = target.endsWith("Move.toml");
    const isMoveDir =
      targetExists && existsSync(path.join(target, "Move.toml"));
    const rawData = isMoveToml || isMoveDir ? {} : await readJsonTarget(target);
    const isFixtureWrapper =
      typeof rawData === "object" &&
      rawData !== null &&
      "input" in rawData &&
      "kind" in rawData &&
      typeof (rawData as { kind?: unknown }).kind === "string";
    const data = isFixtureWrapper
      ? (rawData as { input: unknown }).input
      : rawData;
    const input = {
      kind:
        isMoveToml || isMoveDir
          ? "move-package"
          : isFixtureWrapper
            ? (
                rawData as {
                  kind:
                    | "transaction-payload"
                    | "entry-function-call"
                    | "move-package"
                    | "network-config"
                    | "generic-json";
                }
              ).kind
            : detectKind(target, data),
      source: target,
      data,
    };
    const profile =
      isFixtureWrapper &&
      typeof (rawData as { profile?: unknown }).profile === "string"
        ? (rawData as unknown as { profile: "strict" | "relaxed" }).profile
        : "strict";
    const validation = targetExists
      ? await validateInputNode(input, {
          fetchImpl: globalThis.fetch,
          profile,
        })
      : await validateOfflineInput(input, { profile });
    const summary = summarizeDetail(validation.results, profile);
    if (parseFlag(args, "-j")) {
      io.out(
        JSON.stringify(
          {
            target,
            status: summary.status,
            summary: summary.summary,
            results: validation.results,
          },
          null,
          2,
        ),
      );
    } else {
      io.out(`target=${target}`);
      io.out(`status=${summary.status}`);
      io.out(`rules=${validation.results.length}`);
      for (const result of validation.results) {
        io.out(`${result.ruleId} ${result.status}`);
      }
    }
    return summary.status === "fail" ? 1 : 0;
  } catch (error) {
    io.err(error instanceof Error ? error.message : "Validation failed.");
    return 2;
  }
}

async function handleHarness(args: string[], io: CliIO): Promise<number> {
  const subcommand = args[0];
  if (subcommand !== "run") {
    io.err("Expected harness run.");
    return 2;
  }
  const fixtureDir = args[1] ?? "examples/tx-payloads/fixtures";
  const outputDir = parseOption(args, "-o", "reports");
  const result = await runHarness({ fixtureDir, outputDir });
  io.out(result.summaryText);
  return result.exitCode;
}

async function handleReport(args: string[], io: CliIO): Promise<number> {
  const subcommand = args[0];
  const reportPath = args[1];
  if (subcommand !== "view" || !reportPath) {
    io.err("Expected report view <report.json>.");
    return 2;
  }
  const report = parseReport(await readFile(reportPath, "utf8"));
  io.out(`generated_at=${report.generatedAt}`);
  io.out(`total=${report.summary.total}`);
  io.out(`pass=${report.summary.pass}`);
  io.out(`fail=${report.summary.fail}`);
  io.out(`warning=${report.summary.warning}`);
  return 0;
}

async function selectProvider(given?: string): Promise<string> {
  if (given && given in ciTemplates) {
    return given;
  }
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(
    "Select CI provider (gitlab, circle, bitbucket, azure, generic): ",
  );
  rl.close();
  return answer.trim();
}

async function handleInitCi(args: string[], io: CliIO): Promise<number> {
  const provider = await selectProvider(args[0]);
  if (!(provider in ciTemplates)) {
    io.err("Unsupported CI provider.");
    return 2;
  }
  await mkdir("ci", { recursive: true });
  await writeFile("ci/run.sh", sharedRunScript, "utf8");
  const template = ciTemplates[provider];
  if (!template) {
    io.err("CI template not found.");
    return 2;
  }
  await mkdir(path.dirname(template.target), { recursive: true });
  await writeFile(template.target, template.content, "utf8");
  if (provider !== "generic") {
    io.out(`Created ${template.target}`);
    io.out("Created ci/run.sh");
  } else {
    io.out("Created ci/run.sh");
  }
  return 0;
}

export async function runCli(
  args: string[],
  io: CliIO = defaultIO,
): Promise<number> {
  const [command, ...rest] = args;
  if (!command || command === "help" || command === "-h") {
    io.out(helpText());
    return 0;
  }
  if (command === "doctor") {
    return handleDoctor(io);
  }
  if (command === "validate") {
    return handleValidate(rest, io);
  }
  if (command === "harness") {
    return handleHarness(rest, io);
  }
  if (command === "report") {
    return handleReport(rest, io);
  }
  if (command === "init-ci") {
    return handleInitCi(rest, io);
  }
  io.err(`Unknown command: ${command}`);
  io.out(helpText());
  return 2;
}
