import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type Fixture,
  type HarnessRunResult,
  type Report,
  type ReportDetail,
  summarizeDetail,
  summarizeResults,
} from "@idoa/core";
import { formatReportJson, formatSummaryText } from "@idoa/report";
import { validateInputNode } from "@idoa/validator/node";

export interface HarnessOptions {
  fixtureDir: string;
  outputDir?: string;
  now?: () => number;
}

export async function loadFixtures(fixtureDir: string): Promise<Fixture[]> {
  const entries = await collectFixtureFiles(fixtureDir);
  const fixtures: Fixture[] = [];
  for (const entry of entries) {
    const content = await readFile(entry, "utf8");
    fixtures.push(JSON.parse(content) as Fixture);
  }
  return fixtures;
}

async function collectFixtureFiles(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const target = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFixtureFiles(target)));
      continue;
    }
    if (
      entry.isFile() &&
      (entry.name === "fixture.json" || entry.name.endsWith(".fixture.json"))
    ) {
      files.push(target);
    }
  }
  return files.sort();
}

export async function runHarness(
  options: HarnessOptions,
): Promise<HarnessRunResult> {
  const now = options.now ?? (() => Date.now());
  const startedAt = now();
  const outputDir = options.outputDir ?? path.join(process.cwd(), "reports");
  let fixtures: Fixture[];
  try {
    fixtures = await loadFixtures(options.fixtureDir);
  } catch {
    const report: Report = {
      schemaVersion: "1.0.0",
      generatedAt: new Date(now()).toISOString(),
      durationMs: now() - startedAt,
      summary: { total: 0, pass: 0, fail: 0, warning: 0 },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        toolVersion: "0.1.0",
        mode: "offline",
        profile: "strict",
      },
      details: [],
    };
    await mkdir(outputDir, { recursive: true });
    const summaryText =
      "total=0\npass=0\nfail=0\nwarning=0\ntop_failures=config_error";
    await writeFile(
      path.join(outputDir, "devflow-report.json"),
      formatReportJson(report),
      "utf8",
    );
    await writeFile(
      path.join(outputDir, "devflow-summary.txt"),
      summaryText,
      "utf8",
    );
    return { exitCode: 2, report, summaryText };
  }
  const details: ReportDetail[] = [];

  if (fixtures.length === 0) {
    const report: Report = {
      schemaVersion: "1.0.0",
      generatedAt: new Date(now()).toISOString(),
      durationMs: now() - startedAt,
      summary: { total: 0, pass: 0, fail: 0, warning: 0 },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        toolVersion: "0.1.0",
        mode: "offline",
        profile: "strict",
      },
      details: [],
    };
    await mkdir(outputDir, { recursive: true });
    const summaryText =
      "total=0\npass=0\nfail=0\nwarning=0\ntop_failures=config_error";
    await writeFile(
      path.join(outputDir, "devflow-report.json"),
      formatReportJson(report),
      "utf8",
    );
    await writeFile(
      path.join(outputDir, "devflow-summary.txt"),
      summaryText,
      "utf8",
    );
    return { exitCode: 2, report, summaryText };
  }

  for (const fixture of fixtures) {
    const validation = await validateInputNode(
      {
        kind: fixture.kind,
        source: fixture.id,
        data: fixture.input,
        metadata: fixture.metadata as Record<string, unknown> | undefined,
      },
      {
        mode: fixture.mode ?? "offline",
        profile: fixture.profile ?? "strict",
        fetchImpl: globalThis.fetch,
        now,
      },
    );

    const profile = fixture.profile ?? "strict";
    const detailStatus = summarizeDetail(validation.results, profile);

    details.push({
      fixtureId: fixture.id,
      target: fixture.title,
      fixtureExpectedOutcome: fixture.expectedStatus,
      summary: detailStatus.summary,
      status: detailStatus.status,
      results: validation.results,
    });
  }

  const flattenedResults = details.flatMap((detail) => detail.results);
  const summary = summarizeResults(flattenedResults);
  const report: Report = {
    schemaVersion: "1.0.0",
    generatedAt: new Date(now()).toISOString(),
    durationMs: now() - startedAt,
    summary,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      toolVersion: "0.1.0",
      mode: fixtures.some((fixture) => fixture.mode === "online")
        ? "online"
        : "offline",
      profile: "strict",
    },
    details,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "devflow-report.json"),
    formatReportJson(report),
    "utf8",
  );
  const summaryText = formatSummaryText(report);
  await writeFile(
    path.join(outputDir, "devflow-summary.txt"),
    summaryText,
    "utf8",
  );

  const hasExpectationMismatch = fixtures.some(
    (fixture, index) => fixture.expectedStatus !== details[index]?.status,
  );
  const exitCode = hasExpectationMismatch ? 1 : 0;
  return { exitCode: exitCode as 0 | 1, report, summaryText };
}
