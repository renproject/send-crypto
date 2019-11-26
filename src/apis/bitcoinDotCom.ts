import axios from "axios";

import { fixValues, UTXO } from "../lib/mercury";
import { retryNTimes } from "../lib/retry";

const fetchUTXOs = async (url: string): Promise<readonly UTXO[]> => {
    const response = await retryNTimes(
        () => axios.get<{
            readonly utxos: ReadonlyArray<{
                readonly address: string;
                readonly txid: string;
                readonly vout: number;
                readonly scriptPubKey: string;
                readonly amount: number;
                readonly satoshis: number;
                readonly confirmations: number;
                readonly ts: number;
            }>
        }>(url),
        5,
    );
    return fixValues(response.data.utxos.map(utxo => ({
        txid: utxo.txid,
        value: utxo.amount,
        script_hex: utxo.scriptPubKey,
        output_no: utxo.vout,
        confirmations: utxo.confirmations,
    })), 8);
};

export const BitcoinDotCom = {
    fetchUTXOs,
};
