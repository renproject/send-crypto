import axios from "axios";
import { DEFAULT_TIMEOUT } from "./timeout";

export const MULTICHAIN_URLS = {
    BTC: "https://multichain.renproject.io/mainnet/bitcoind",
    BTCTEST: "https://multichain-staging.renproject.io/testnet/bitcoind",
    ZEC: "https://multichain.renproject.io/mainnet/zcashd",
    ZECTEST: "https://multichain-staging.renproject.io/testnet/zcashd",
    BCH: "https://multichain.renproject.io/mainnet/bitcoincashd",
    BCHTEST: "https://multichain-staging.renproject.io/testnet/bitcoincashd",
};

const broadcastTransaction = (url: string) => async (
    txHex: string
): Promise<string> => {
    const response = await axios.post<{
        result: string;
        error: null;
        id: string | number;
    }>(
        url,
        {
            jsonrpc: "1.0",
            id: "67",
            method: "sendrawtransaction",
            params: [txHex],
        },
        { timeout: DEFAULT_TIMEOUT }
    );
    return response.data.result;
};

export const JSONRPC = {
    broadcastTransaction,
};
