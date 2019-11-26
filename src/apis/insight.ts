import axios from "axios";
import https from "https";

import { fixValue, UTXO } from "../lib/mercury";
import { retryNTimes } from "../lib/retry";

const fetchUTXOs = async (url: string): Promise<readonly UTXO[]> => {
    const response = await retryNTimes(
        () => axios.get<ReadonlyArray<{
            readonly address: string;
            readonly txid: string;
            readonly vout: number;
            readonly scriptPubKey: string;
            readonly amount: number;
            readonly satoshis: number;
            readonly confirmations: number;
            readonly ts: number;
        }>>(url, {
            // TTODO: Remove when certificate is fixed.
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        }),
        5,
    );

    return response.data.map(utxo => ({
        txid: utxo.txid,
        value: utxo.satoshis || fixValue(utxo.amount, 8),
        script_hex: utxo.scriptPubKey,
        output_no: utxo.vout,
        confirmations: utxo.confirmations,
    }));
};

export const Insight = {
    fetchUTXOs,
}