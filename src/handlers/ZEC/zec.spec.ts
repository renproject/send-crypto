import test, { ExecutionContext } from "ava";

import { Insight } from "../../common/apis/insight";
import { Sochain } from "../../common/apis/sochain";
import { UTXO } from "../../lib/mercury";

const testEndpoints = async (t: ExecutionContext<unknown>, endpoints: ReadonlyArray<() => Promise<readonly UTXO[]>>) => {
    let expectedResult = null;
    for (const endpoint of endpoints) {
        const result = await endpoint();
        expectedResult = expectedResult || result;
        t.deepEqual(expectedResult, result);
    }
};

const testnetAddress = "tmDLRUiVjPCSbtrL6R9hTBhUdcBKYTVG7qc";
const mainnetAddress = "t1MVg9t1KzXw6kc8ekRPiL2ot1CEivHhAZv";
const confirmations = 0;

test.only("Testnet ZEC", testEndpoints, [
    () => Insight.fetchUTXOs(`https://explorer.testnet.z.cash/api/`)(testnetAddress, confirmations),
    // () => Sochain.fetchUTXOs("ZECTEST")(testnetAddress, confirmations),
]);

test.only("Mainnet ZEC", testEndpoints, [
    () => Insight.fetchUTXOs(`https://explorer.z.cash/api/`)(mainnetAddress, confirmations),
    // () => Insight.fetchUTXOs(`https://zecblockexplorer.com/`)(mainnetAddress, confirmations),
    // () => Insight.fetchUTXOs(`https://zcashnetwork.info/api/`)(mainnetAddress, confirmations),
    // () => Insight.fetchUTXOs(`https://zechain.net/api/v1/`)(mainnetAddress, confirmations),
    // () => Insight.fetchUTXOs(`https://zcash.blockexplorer.com/api/`)(mainnetAddress, confirmations),
    // () => Sochain.fetchUTXOs("ZEC")(mainnetAddress, confirmations),
]);
