import { mkdir, writeFile } from "node:fs/promises";
import {
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Report, type ValidatorInput, summarizeDetail } from "@idoa/core";
import { runHarness } from "@idoa/harness";
import { formatReportJson, formatSummaryText } from "@idoa/report";
import { validateInputNode } from "@idoa/validator/node";

const payloadLimit = 64 * 1024;
const requestLog = new Map<string, { count: number; resetAt: number }>();
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

function json(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    let content = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > payloadLimit) {
        reject(new Error("Payload too large."));
        request.destroy();
        return;
      }
      content += chunk;
    });
    request.on("end", () => resolve(content));
    request.on("error", reject);
  });
}

function allowRequest(request: IncomingMessage): boolean {
  const key = request.socket.remoteAddress ?? "local";
  const now = Date.now();
  const record = requestLog.get(key);
  if (!record || record.resetAt <= now) {
    requestLog.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (record.count >= Number(process.env.DEVFLOW_RATE_LIMIT ?? 30)) {
    return false;
  }
  record.count += 1;
  return true;
}

async function validateHandler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  const raw = await readBody(request);
  const body = JSON.parse(raw) as { input: ValidatorInput };
  const report = await runRemoteValidate(body.input);
  json(response, 200, {
    report,
    summary: formatSummaryText(report),
  });
}

async function harnessHandler(
  _request: IncomingMessage,
  response: ServerResponse,
) {
  const result = await runRemoteHarness();
  json(response, 200, {
    report: result.report,
    summary: result.summaryText,
    exitCode: result.exitCode,
  });
}

export async function runRemoteValidate(
  input: ValidatorInput,
): Promise<Report> {
  const validation = await validateInputNode(input, {
    mode: "online",
    fetchImpl: globalThis.fetch,
  });
  const detail = summarizeDetail(validation.results, "relaxed");
  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    durationMs: validation.results.reduce(
      (sum, result) => sum + result.durationMs,
      0,
    ),
    summary: detail.summary,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      toolVersion: "0.1.0",
      mode: "online",
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
}

export async function runRemoteHarness() {
  const outputDir = path.join(repoRoot, "reports");
  const result = await runHarness({
    fixtureDir: path.join(repoRoot, "examples", "tx-payloads", "fixtures"),
    outputDir,
  });
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "devflow-report.json"),
    formatReportJson(result.report),
    "utf8",
  );
  return result;
}

export function createAppServer() {
  return createServer(async (request, response) => {
    try {
      if (!allowRequest(request)) {
        json(response, 429, { error: "Rate limit exceeded." });
        return;
      }
      if (request.method === "GET" && request.url === "/api/health") {
        json(response, 200, { status: "ok" });
        return;
      }
      if (request.method === "POST" && request.url === "/api/validate") {
        await validateHandler(request, response);
        return;
      }
      if (request.method === "POST" && request.url === "/api/harness") {
        await harnessHandler(request, response);
        return;
      }
      json(response, 404, { error: "Not found." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error.";
      json(response, 400, { error: message });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.DEVFLOW_SERVER_PORT ?? 4177);
  createAppServer().listen(port, () => {
    process.stdout.write(`devflow playground server listening on ${port}\n`);
  });
}
