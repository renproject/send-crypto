import test, { ExecutionContext } from "ava";
import { List } from "immutable";

import { Blockchair } from "../../common/apis/blockchair";
import { Blockstream } from "../../common/apis/blockstream";

export const testEndpoints = async (t: ExecutionContext<unknown>, endpoints: ReadonlyArray<() => Promise<any>>) => {
    let expectedResult = null;
    for (const endpoint of endpoints) {
        let result = await endpoint();
        try {
            if (Array.isArray(result)) {
                result = List(result).sortBy(x => x.txid).toArray();
            }
        } catch (error) {
            // ignore error
        }
        expectedResult = expectedResult || result;
        t.deepEqual(expectedResult, result);
    }
};

// Test address endpoint ///////////////////////////////////////////////////////
const testnetAddress = "mj92SbgAqEakw5ZNXZYy28vHcXeM7XuVap";
const mainnetAddress = "18og2fAayHpNEW1j5DahB25u1yTg8kqhVf";
const confirmations = 6;

test("Testnet BTC", testEndpoints, [
    // () => Sochain.fetchUTXOs("BTCTEST")(testnetAddress, confirmations),
    () => Blockstream.fetchUTXOs(true)(testnetAddress, confirmations),
    () => Blockchair.fetchUTXOs("bitcoin/testnet")(testnetAddress, confirmations),
]);

test("Mainnet BTC", testEndpoints, [
    // () => Sochain.fetchUTXOs("BTCTEST")(mainnetAddress, confirmations),
    () => Blockstream.fetchUTXOs(false)(mainnetAddress, confirmations),
    () => Blockchair.fetchUTXOs("bitcoin")(mainnetAddress, confirmations),
]);

// Test confirmations endpoint /////////////////////////////////////////////////
const testnetHash = "b287676e403d31c26debf9b05073d3c9145f0c4b6485f3815cc5ac5bc21ecdc9";
const mainnetHash = "0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098";

test("Testnet BTC confirmations", testEndpoints, [
    () => Blockstream.fetchConfirmations(true)(testnetHash),
    () => Blockchair.fetchConfirmations("bitcoin/testnet")(testnetHash),
]);

test("Mainnet BTC confirmations", testEndpoints, [
    () => Blockstream.fetchConfirmations(false)(mainnetHash),
    () => Blockchair.fetchConfirmations("bitcoin")(mainnetHash),
]);