import test from "ava";

import { Insight } from "../../common/apis/insight";
import { testEndpoints } from "../../spec/specUtils";

const testnetAddress = "tmDLRUiVjPCSbtrL6R9hTBhUdcBKYTVG7qc";
const mainnetAddress = "t3QTUGG2YqpiDg8aSrj3ZN7sKTs3frrdYAt";
const confirmations = 6;

test("Testnet ZEC", testEndpoints, [
    () => Insight.fetchUTXOs(`https://explorer.testnet.z.cash/api/`)(testnetAddress, confirmations),
]);

test("Mainnet ZEC", testEndpoints, [
    () => Insight.fetchUTXOs(`https://explorer.z.cash/api/`)(mainnetAddress, confirmations),
]);

const testnetHash = "fcc25c1a1f7df38ce15211b324385d837540dc0a97c3056f7497dacabef77c3f";
const mainnetHash = "dd428d9f859ed78ee8597f8c8e3ba990b0d4750f78b08e8f507fb279b64f1c71";

test("Testnet ZEC confirmations", testEndpoints, [
    () => Insight.fetchConfirmations("https://explorer.testnet.z.cash/api")(testnetHash),
]);

test("Mainnet ZEC confirmations", testEndpoints, [
    () => Insight.fetchConfirmations("https://explorer.z.cash/api")(mainnetHash),
]);

test("Testnet ZEC UTXO", testEndpoints, [
    () => Insight.fetchUTXO("https://explorer.testnet.z.cash/api")(testnetHash, 0),
]);

test("Mainnet ZEC UTXO", testEndpoints, [
    () => Insight.fetchUTXO("https://explorer.z.cash/api")(mainnetHash, 0),
]);
