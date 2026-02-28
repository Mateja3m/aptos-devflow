import { describe, expect, test } from "vitest";
import {
  detectKind,
  validateOfflineInput,
} from "../packages/validator/src/index.js";

describe("validator offline rules", () => {
  test("detects transaction payload kind", () => {
    const kind = detectKind("payload.json", {
      type: "entry_function_payload",
      function: "0x1::aptos_account::transfer",
    });
    expect(kind).toBe("transaction-payload");
  });

  test("returns deterministic ordered rules", async () => {
    const result = await validateOfflineInput({
      kind: "transaction-payload",
      source: "sample.json",
      data: {
        type: "entry_function_payload",
        function: "0x1::aptos_account::transfer",
        type_arguments: [],
        arguments: ["0x2", "10"],
        gas_unit_price: 1,
        max_gas_amount: 1000,
        network: "testnet",
      },
    });
    const ids = result.results.map((item) => item.ruleId);
    expect(ids).toEqual([...ids].sort());
  });

  test("fails invalid payload shape", async () => {
    const result = await validateOfflineInput({
      kind: "transaction-payload",
      source: "invalid.json",
      data: {
        function: "invalid",
        type_arguments: [],
        arguments: ["0x2", null],
        gas_unit_price: 0,
        network: "devnet",
      },
    });
    expect(result.overallStatus).toBe("fail");
    expect(
      result.results.some(
        (item) =>
          item.ruleId === "aptos.tx.payload-shape" && item.status === "fail",
      ),
    ).toBe(true);
  });
});
