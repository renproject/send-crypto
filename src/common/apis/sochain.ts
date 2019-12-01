import axios from "axios";

import { fixValues, UTXO } from "../../lib/mercury";
import { retryNTimes } from "../../lib/retry";

const fetchUTXOs = (network: string) => async (address: string, confirmations: number) => {
    const url = `https://sochain.com/api/v2/get_tx_unspent/${network}/${address}/${confirmations}`;
    const response = await retryNTimes(
        () => axios.get<{ readonly data: { readonly txs: readonly UTXO[] } }>(url),
        5,
    );

    return fixValues(response.data.data.txs, 8).filter(utxo => confirmations === 0 || utxo.confirmations >= confirmations);
};

const broadcastTransaction = (network: string) => async (txHex: string): Promise<string> => {
    const response = await axios.post<{
        readonly status: "success";
        readonly data: {
            readonly network: string;
            readonly txid: string; // Hex without 0x
        }
    }>(`https://chain.so/send_tx/${network}`, { tx_hex: txHex });
    return response.data.data.txid;
};

export const Sochain = {
    fetchUTXOs,
    broadcastTransaction,
}
