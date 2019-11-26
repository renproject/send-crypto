import axios from "axios";

import { fixValues, UTXO } from "../lib/mercury";
import { retryNTimes } from "../lib/retry";

const fetchUTXOs = async (url: string) => {
    const response = await retryNTimes(
        () => axios.get<{ readonly data: { readonly txs: readonly UTXO[] } }>(url),
        5,
    );

    return fixValues(response.data.data.txs, 8);
};

const broadcastTransaction = async (txHex: string, testnet: boolean): Promise<string> => {
    const response = await axios.post<{
        readonly status: "success";
        readonly data: {
            readonly network: string;
            readonly txid: string; // Hex without 0x
        }
    }>(`https://chain.so/send_tx/${testnet ? "BTCTEST" : "BTC"}`, { tx_hex: txHex });
    return response.data.data.txid;
};

export const Sochain = {
    fetchUTXOs,
    broadcastTransaction,
}
