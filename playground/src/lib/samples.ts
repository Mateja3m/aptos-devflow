export const validSample = {
  type: "entry_function_payload",
  function: "0x1::aptos_account::transfer",
  type_arguments: [],
  arguments: ["0x2", "1000"],
  max_gas_amount: 1000,
  gas_unit_price: 1,
  network: "testnet",
  url: "https://api.testnet.aptoslabs.com/v1",
  events: [],
};

export const invalidSample = {
  function: "aptos_account::transfer",
  type_arguments: [],
  arguments: ["0x2", null],
  max_gas_amount: 20000,
  gas_unit_price: 0,
  network: "devnet",
};

export const fixtureOptions = [
  {
    id: "valid-transfer",
    label: "Valid transfer",
    payload: validSample,
    kind: "transaction-payload" as const,
  },
  {
    id: "invalid-sample",
    label: "Invalid payload",
    payload: invalidSample,
    kind: "transaction-payload" as const,
  },
];
