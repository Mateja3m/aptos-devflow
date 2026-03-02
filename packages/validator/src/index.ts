import {
  type ProfileName,
  type ValidationMessage,
  type ValidationResult,
  type ValidationStatus,
  type ValidatorContext,
  type ValidatorInput,
  type ValidatorRule,
  inferStatus,
  isRecord,
  makeResult,
  profileConfigs,
} from "@idoa/core";

export interface ValidateOptions {
  profile?: ProfileName;
  cwd?: string;
  now?: () => number;
}

export interface ValidateRun {
  results: ValidationResult[];
  overallStatus: "pass" | "fail";
}

const networkMap: Record<string, string> = {
  local: "http://127.0.0.1:8080/v1",
  testnet: "https://api.testnet.aptoslabs.com/v1",
  mainnet: "https://api.mainnet.aptoslabs.com/v1",
};

export function createOfflineContext(
  options: ValidateOptions = {},
): ValidatorContext {
  return {
    cwd: options.cwd ?? process.cwd(),
    mode: "offline",
    profile: options.profile ?? "strict",
    now: options.now ?? (() => Date.now()),
  };
}

function parseJsonValue(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function resultFromRule(
  rule: ValidatorRule,
  startedAt: number,
  messages: ValidationMessage[],
  context: ValidatorContext,
  metadata?: Record<string, unknown>,
): ValidationResult {
  return makeResult(
    rule.id,
    inferStatus(messages),
    startedAt,
    messages,
    rule.title,
    rule.description,
    metadata,
    context.now,
  );
}

export const offlineRules: ValidatorRule[] = [
  {
    id: "aptos.event.decoding",
    title: "Event decoding sanity",
    description: "Checks event samples for guid, sequence_number and data.",
    severity: "warning" as const,
    offlineCapable: true,
    async check(input: ValidatorInput, context: ValidatorContext) {
      const startedAt = context.now?.() ?? Date.now();
      const payload = parseJsonValue(input.data);
      const events = Array.isArray(payload?.events) ? payload.events : [];
      const messages: ValidationMessage[] = [];

      for (const [index, event] of events.entries()) {
        if (!isRecord(event)) {
          messages.push({
            code: "event.invalid",
            message: `Event ${index} must be an object.`,
            severity: "error",
          });
          continue;
        }
        if (
          !("guid" in event) ||
          !("sequence_number" in event) ||
          !("data" in event)
        ) {
          messages.push({
            code: "event.fields.missing",
            message: `Event ${index} is missing guid, sequence_number or data.`,
            severity: "warning",
          });
        }
      }

      return resultFromRule(this, startedAt, messages, context);
    },
  },
  {
    id: "aptos.network.config",
    title: "Network configuration",
    description:
      "Validates supported network presets and optional endpoint URL.",
    severity: "error" as const,
    offlineCapable: true,
    async check(input: ValidatorInput, context: ValidatorContext) {
      const startedAt = context.now?.() ?? Date.now();
      const payload = parseJsonValue(input.data) ?? input.metadata ?? {};
      const messages: ValidationMessage[] = [];
      const network = payload.network;

      if (typeof network !== "string") {
        messages.push({
          code: "network.missing",
          message: "network must be provided.",
          severity: "error",
          path: "network",
        });
      } else if (!(network in networkMap)) {
        messages.push({
          code: "network.unsupported",
          message: `Unsupported network ${network}.`,
          severity: "error",
          path: "network",
        });
      } else if (
        typeof payload.url === "string" &&
        payload.url !== networkMap[network]
      ) {
        messages.push({
          code: "network.url.mismatch",
          message: `Configured URL does not match the default ${network} endpoint.`,
          severity: "warning",
          path: "url",
        });
      }

      return resultFromRule(this, startedAt, messages, context, {
        offlineCapable: true,
      });
    },
  },
  {
    id: "aptos.tx.entry-function-args",
    title: "Entry function argument sanity",
    description:
      "Checks for null values and suspiciously empty argument arrays.",
    severity: "error" as const,
    offlineCapable: true,
    async check(input: ValidatorInput, context: ValidatorContext) {
      const startedAt = context.now?.() ?? Date.now();
      const payload = parseJsonValue(input.data);
      const args = Array.isArray(payload?.arguments) ? payload.arguments : [];
      const messages: ValidationMessage[] = [];

      if (args.length === 0) {
        messages.push({
          code: "args.empty",
          message: "Entry function arguments should not be empty.",
          severity: "warning",
        });
      }

      for (const [index, value] of args.entries()) {
        if (value === null || value === undefined) {
          messages.push({
            code: "args.null",
            message: `Argument at index ${index} is null or undefined.`,
            severity: "error",
            path: `arguments.${index}`,
          });
        }
      }

      return resultFromRule(this, startedAt, messages, context);
    },
  },
  {
    id: "aptos.tx.gas-sanity",
    title: "Gas and fee sanity",
    description:
      "Runs deterministic offline bounds checks and marks simulation as skipped.",
    severity: "warning" as const,
    offlineCapable: false,
    async check(input: ValidatorInput, context: ValidatorContext) {
      const startedAt = context.now?.() ?? Date.now();
      const payload = parseJsonValue(input.data);
      const messages: ValidationMessage[] = [];

      if (
        typeof payload?.max_gas_amount === "number" &&
        payload.max_gas_amount > 20_000
      ) {
        messages.push({
          code: "gas.high",
          message: "max_gas_amount is high for a simple entry function.",
          severity: "warning",
        });
      }
      if (
        typeof payload?.gas_unit_price === "number" &&
        payload.gas_unit_price <= 0
      ) {
        messages.push({
          code: "gas.unit.invalid",
          message: "gas_unit_price must be positive.",
          severity: "error",
        });
      }
      messages.push({
        code: "gas.online.skipped",
        message: "Online gas simulation skipped in offline mode.",
        severity: "warning",
      });

      return resultFromRule(this, startedAt, messages, context, {
        onlineOnly: true,
      });
    },
  },
  {
    id: "aptos.tx.payload-shape",
    title: "Transaction payload shape",
    description: "Validates Aptos entry function payload fields and arrays.",
    severity: "error" as const,
    offlineCapable: true,
    async check(input: ValidatorInput, context: ValidatorContext) {
      const startedAt = context.now?.() ?? Date.now();
      const payload = parseJsonValue(input.data);
      const messages: ValidationMessage[] = [];

      if (!payload) {
        messages.push({
          code: "payload.not_object",
          message: "Payload must be a JSON object.",
          severity: "error",
        });
        return resultFromRule(this, startedAt, messages, context);
      }

      if (
        input.kind === "transaction-payload" ||
        "type" in payload ||
        "function" in payload
      ) {
        if (payload.type !== "entry_function_payload") {
          messages.push({
            code: "payload.type.invalid",
            message: "Payload type must be entry_function_payload.",
            severity: "error",
            path: "type",
          });
        }

        if (
          typeof payload.function !== "string" ||
          !/^(0x)?[0-9a-fA-F]+::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/.test(
            payload.function,
          )
        ) {
          messages.push({
            code: "payload.function.invalid",
            message: "Function must match address::module::function.",
            severity: "error",
            path: "function",
          });
        }
      }

      if (!Array.isArray(payload.type_arguments)) {
        messages.push({
          code: "payload.type_arguments.invalid",
          message: "type_arguments must be an array.",
          severity: "error",
          path: "type_arguments",
        });
      }
      if (!Array.isArray(payload.arguments)) {
        messages.push({
          code: "payload.arguments.invalid",
          message: "arguments must be an array.",
          severity: "error",
          path: "arguments",
        });
      }

      return resultFromRule(this, startedAt, messages, context);
    },
  },
].sort((left, right) => left.id.localeCompare(right.id));

export async function runRules(
  input: ValidatorInput,
  rules: ValidatorRule[],
  context: ValidatorContext,
): Promise<ValidateRun> {
  const results: ValidationResult[] = [];
  for (const rule of rules) {
    results.push(await rule.check(input, context));
  }

  const strict = profileConfigs[context.profile].treatWarningsAsFailures;
  const overallStatus = results.some(
    (result) =>
      result.status === "fail" || (strict && result.status === "warning"),
  )
    ? "fail"
    : "pass";
  return { results, overallStatus };
}

export async function validateOfflineInput(
  input: ValidatorInput,
  options: ValidateOptions = {},
): Promise<ValidateRun> {
  return runRules(input, offlineRules, createOfflineContext(options));
}

export function detectKind(
  pathOrUrl: string,
  data: unknown,
): ValidatorInput["kind"] {
  if (typeof pathOrUrl === "string" && pathOrUrl.endsWith("Move.toml")) {
    return "move-package";
  }
  const payload = parseJsonValue(data);
  if (payload?.type === "entry_function_payload") {
    return "transaction-payload";
  }
  if (typeof payload?.network === "string") {
    return "network-config";
  }
  return "generic-json";
}

export function summarizeStatus(results: ValidationResult[]): ValidationStatus {
  if (results.some((result) => result.status === "fail")) {
    return "fail";
  }
  if (results.some((result) => result.status === "warning")) {
    return "warning";
  }
  return "pass";
}
