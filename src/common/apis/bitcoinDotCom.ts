import axios from "axios";

import { fixValues, UTXO } from "../../lib/mercury";
import { retryNTimes } from "../../lib/retry";

const endpoint = (testnet: boolean) => testnet ? "https://trest.bitcoin.com/v2/" : "https://rest.bitcoin.com/v2/";

const fetchUTXOs = (testnet: boolean) => async (address: string, confirmations: number): Promise<readonly UTXO[]> => {
    const url = `${endpoint(testnet).replace(/\/$/, "")}/address/utxo/${address}`;
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
    })).filter(utxo => confirmations === 0 || utxo.confirmations >= confirmations), 8);
};

export const BitcoinDotCom = {
    fetchUTXOs,
};
