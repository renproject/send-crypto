import test from "ava";

import { testEndpoints } from "../../spec/specUtils";
import { _apiFallbacks } from "./BTCHandler";

// Test address endpoint ///////////////////////////////////////////////////////
const testnetAddress = "2MtGQepchoQ6BXZ6PfBD4LTbqipXmD6hice";
const mainnetAddress = "18og2fAayHpNEW1j5DahB25u1yTg8kqhVf";
const confirmations = 6;

test(
    "Testnet BTC UTXOs",
    testEndpoints,
    _apiFallbacks.fetchUTXOs(true, testnetAddress, confirmations),
    /Must provide script hash./
);
test(
    "Mainnet BTC UTXOs",
    testEndpoints,
    _apiFallbacks.fetchUTXOs(false, mainnetAddress, confirmations),
    /Must provide script hash./
);

test(
    "BTCHandler: Testnet BTC TXs",
    testEndpoints,
    _apiFallbacks.fetchTXs(true, testnetAddress),
    /Must provide script hash./
);

test(
    "BTCHandler: Mainnet BTC TXs",
    testEndpoints,
    _apiFallbacks.fetchTXs(false, mainnetAddress),
    /Must provide script hash./
);

// Test confirmations endpoint /////////////////////////////////////////////////
const testnetHash =
    "b287676e403d31c26debf9b05073d3c9145f0c4b6485f3815cc5ac5bc21ecdc9";
const mainnetHash =
    "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098";

test(
    "Testnet BTC UTXO",
    testEndpoints,
    _apiFallbacks.fetchUTXO(true, testnetHash, 0),
    /Must provide script hash./
);
test(
    "Mainnet BTC UTXO",
    testEndpoints,
    _apiFallbacks.fetchUTXO(false, mainnetHash, 0),
    /Must provide script hash./
);
