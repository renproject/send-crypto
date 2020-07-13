import test from "ava";

import { testEndpoints } from "../../spec/specUtils";
import { _apiFallbacks } from "./BTCHandler";

// Test address endpoint ///////////////////////////////////////////////////////
const testnetAddress = "mj92SbgAqEakw5ZNXZYy28vHcXeM7XuVap";
const mainnetAddress = "18og2fAayHpNEW1j5DahB25u1yTg8kqhVf";
const confirmations = 6;

test("Testnet BTC", testEndpoints, _apiFallbacks.fetchUTXOs(true, testnetAddress, confirmations));
test("Mainnet BTC", testEndpoints, _apiFallbacks.fetchUTXOs(false, mainnetAddress, confirmations));

// Test confirmations endpoint /////////////////////////////////////////////////
const testnetHash = "b287676e403d31c26debf9b05073d3c9145f0c4b6485f3815cc5ac5bc21ecdc9";
const mainnetHash = "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098";

test("Testnet BTC confirmations", testEndpoints, _apiFallbacks.fetchConfirmations(true, testnetHash));
test("Mainnet BTC confirmations", testEndpoints, _apiFallbacks.fetchConfirmations(false, mainnetHash));

test("Testnet BTC UTXO", testEndpoints, _apiFallbacks.fetchUTXO(true, testnetHash, 0));
test("Mainnet BTC UTXO", testEndpoints, _apiFallbacks.fetchUTXO(false, mainnetHash, 0));
