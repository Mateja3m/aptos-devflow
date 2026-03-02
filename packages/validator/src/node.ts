import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import {
  type ProfileName,
  type ValidationMessage,
  type ValidationResult,
  type ValidationStatus,
  type ValidatorContext,
  type ValidatorInput,
  type ValidatorRule,
  makeResult,
} from "@idoa/core";
import {
  type ValidateRun,
  createOfflineContext,
  offlineRules,
  runRules,
} from "./index.js";

const execFileAsync = promisify(execFile);

export interface ValidateNodeOptions {
  profile?: ProfileName;
  cwd?: string;
  mode?: "offline" | "online";
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const moveCompileRule: ValidatorRule = {
  id: "aptos.move.compile",
  title: "Move compile check",
  description:
    "Invokes aptos move compile when a Move package path or Move.toml is provided.",
  severity: "error" as const,
  offlineCapable: true,
  async check(input: ValidatorInput, context: ValidatorContext) {
    const startedAt = context.now?.() ?? Date.now();
    const messages: ValidationMessage[] = [];
    if (input.kind !== "move-package") {
      return makeResult(
        this.id,
        "pass",
        startedAt,
        [],
        this.title,
        this.description,
        undefined,
        context.now,
      );
    }

    const packageDir = input.source.endsWith("Move.toml")
      ? path.dirname(input.source)
      : input.source;
    try {
      await execFileAsync(
        "aptos",
        ["move", "compile", "--package-dir", packageDir],
        { cwd: context.cwd, timeout: 30_000 },
      );
    } catch (error) {
      const execError = error as {
        code?: string | number;
        stderr?: string;
        message?: string;
      };
      if (execError.code === "ENOENT") {
        messages.push({
          code: "move.cli.missing",
          message:
            "Aptos CLI not found. Install it to enable Move compile validation.",
          severity: "warning",
        });
      } else {
        messages.push({
          code: "move.compile.failed",
          message:
            execError.stderr?.trim() ||
            execError.message ||
            "Move compile failed.",
          severity: "error",
        });
      }
    }

    return makeResult(
      this.id,
      messages.some((message) => message.severity === "error")
        ? "fail"
        : messages.length > 0
          ? "warning"
          : "pass",
      startedAt,
      messages,
      this.title,
      this.description,
      undefined,
      context.now,
    );
  },
};

const onlineRule: ValidatorRule = {
  id: "aptos.network.online-check",
  title: "Online network reachability",
  description: "Performs a lightweight ledger info request in online mode.",
  severity: "warning" as const,
  offlineCapable: false,
  async check(input: ValidatorInput, context: ValidatorContext) {
    const startedAt = context.now?.() ?? Date.now();
    const messages: ValidationMessage[] = [];
    if (context.mode === "offline" || !context.fetchImpl) {
      messages.push({
        code: "network.online.skipped",
        message: "Online network check skipped in offline mode.",
        severity: "warning",
      });
      return makeResult(
        this.id,
        "warning",
        startedAt,
        messages,
        this.title,
        this.description,
        { onlineOnly: true },
        context.now,
      );
    }

    const data =
      typeof input.data === "object" && input.data
        ? (input.data as Record<string, unknown>)
        : {};
    const url =
      typeof data.url === "string"
        ? data.url
        : "https://api.testnet.aptoslabs.com/v1";
    try {
      const response = await context.fetchImpl(url, { method: "GET" });
      if (!response.ok) {
        messages.push({
          code: "network.online.failed",
          message: `Ledger endpoint returned ${response.status}.`,
          severity: "warning",
        });
      }
    } catch {
      messages.push({
        code: "network.online.failed",
        message: "Ledger endpoint request failed.",
        severity: "warning",
      });
    }
    return makeResult(
      this.id,
      messages.length > 0 ? "warning" : "pass",
      startedAt,
      messages,
      this.title,
      this.description,
      { onlineOnly: true },
      context.now,
    );
  },
};

const simulationRule: ValidatorRule = {
  id: "aptos.tx.simulation",
  title: "Aptos RPC simulation",
  description:
    "Calls the Aptos simulate transaction endpoint when RPC configuration is provided.",
  severity: "warning" as const,
  offlineCapable: false,
  async check(input: ValidatorInput, context: ValidatorContext) {
    const startedAt = context.now?.() ?? Date.now();
    const messages: ValidationMessage[] = [];
    const metadata =
      typeof input.metadata === "object" && input.metadata
        ? (input.metadata as Record<string, unknown>)
        : {};
    const rpcUrlEnv =
      typeof metadata.rpcUrlEnv === "string" ? metadata.rpcUrlEnv : undefined;
    const rpcUrl =
      typeof metadata.rpcUrl === "string"
        ? metadata.rpcUrl
        : rpcUrlEnv
          ? process.env[rpcUrlEnv]
          : undefined;
    const simulationRequest =
      typeof metadata.simulationRequest === "object" &&
      metadata.simulationRequest
        ? (metadata.simulationRequest as Record<string, unknown>)
        : undefined;

    if (context.mode === "offline") {
      messages.push({
        code: "simulation.offline.skipped",
        message: "Aptos RPC simulation skipped in offline mode.",
        severity: "warning",
      });
      return makeResult(
        this.id,
        "warning",
        startedAt,
        messages,
        this.title,
        this.description,
        { onlineOnly: true, rpcRequired: true },
        context.now,
      );
    }

    if (!context.fetchImpl || !rpcUrl || !simulationRequest) {
      messages.push({
        code: "simulation.config.skipped",
        message:
          "Aptos RPC simulation skipped because rpcUrl or simulationRequest is missing.",
        severity: "warning",
      });
      return makeResult(
        this.id,
        "warning",
        startedAt,
        messages,
        this.title,
        this.description,
        { onlineOnly: true, rpcRequired: true },
        context.now,
      );
    }

    try {
      const response = await context.fetchImpl(
        `${rpcUrl.replace(/\/$/, "")}/transactions/simulate`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            ...simulationRequest,
            payload: input.data,
          }),
        },
      );
      if (!response.ok) {
        messages.push({
          code: "simulation.failed",
          message: `Aptos RPC simulation returned ${response.status}.`,
          severity: "warning",
        });
      }
    } catch {
      messages.push({
        code: "simulation.failed",
        message: "Aptos RPC simulation request failed.",
        severity: "warning",
      });
    }

    return makeResult(
      this.id,
      messages.length > 0 ? "warning" : "pass",
      startedAt,
      messages,
      this.title,
      this.description,
      { onlineOnly: true, rpcRequired: true },
      context.now,
    );
  },
};

export async function validateInputNode(
  input: ValidatorInput,
  options: ValidateNodeOptions = {},
): Promise<ValidateRun> {
  const context: ValidatorContext = {
    ...createOfflineContext(options),
    mode: options.mode ?? "offline",
    fetchImpl: options.fetchImpl,
  };
  return runRules(
    input,
    [...offlineRules, moveCompileRule, onlineRule, simulationRule].sort(
      (left, right) => left.id.localeCompare(right.id),
    ),
    context,
  );
}
