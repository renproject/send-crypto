import test from "ava";

import { testEndpoints } from "../../spec/specUtils";
import { _apiFallbacks } from "./ZECHandler";

// const testnetAddress = "tmDLRUiVjPCSbtrL6R9hTBhUdcBKYTVG7qc";
const testnetAddress = "t2KBsNZQ7h4wU8Q3on3vUpf31954zcHu8NW";
const mainnetAddress = "t3QTUGG2YqpiDg8aSrj3ZN7sKTs3frrdYAt";
const confirmations = 6;

test(
    "ZECHandler: Testnet ZEC UTXOs",
    testEndpoints,
    _apiFallbacks.fetchUTXOs(true, testnetAddress, confirmations),
    /(zechain.net)|(zcash.blockexplorer.com)/ // ignore errors
);
test(
    "ZECHandler: Mainnet ZEC UTXOs",
    testEndpoints,
    _apiFallbacks.fetchUTXOs(false, mainnetAddress, confirmations),
    /(zechain.net)|(zcash.blockexplorer.com)/ // ignore errors
);

test(
    "ZECHandler: Testnet ZEC TXs",
    testEndpoints,
    _apiFallbacks.fetchTXs(true, testnetAddress),
    /(zechain.net)|(zcash.blockexplorer.com)/ // ignore errors
);

test(
    "ZECHandler: Mainnet ZEC TXs",
    testEndpoints,
    _apiFallbacks.fetchTXs(false, mainnetAddress),
    /(zechain.net)|(zcash.blockexplorer.com)/ // ignore errors
);

const testnetHash =
    "fcc25c1a1f7df38ce15211b324385d837540dc0a97c3056f7497dacabef77c3f";
const mainnetHash =
    "dd428d9f859ed78ee8597f8c8e3ba990b0d4750f78b08e8f507fb279b64f1c71";

test(
    "ZECHandler: Testnet ZEC UTXO",
    testEndpoints,
    _apiFallbacks.fetchUTXO(true, testnetHash, 0),
    /(zechain.net)|(zcash.blockexplorer.com)/ // ignore errors
);

test(
    "ZECHandler: Mainnet ZEC UTXO",
    testEndpoints,
    _apiFallbacks.fetchUTXO(false, mainnetHash, 0),
    /(zechain.net)|(zcash.blockexplorer.com)/ // ignore errors
);
