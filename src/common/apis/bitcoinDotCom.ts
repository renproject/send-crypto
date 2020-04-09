import axios from "axios";

import { fixValues, sortUTXOs, UTXO } from "../../lib/utxo";

const endpoint = (testnet: boolean) => testnet ? "https://trest.bitcoin.com/v2/" : "https://rest.bitcoin.com/v2/";

const fetchConfirmations = (testnet: boolean) => async (txid: string): Promise<number> => {
    const url = `${endpoint(testnet).replace(/\/$/, "")}/transaction/details/${txid}`;

    const response = await axios.get<{
        txid: string; // 'cacec549d9f1f67e9835889a2ce3fc0d593bd78d63f63f45e4c28a59e004667d',
        version: number; // 4,
        locktime: number; // 0,
        vin: any; // [[Object]],
        vout: any; // [[Object]],
        blockhash: string; // -1,
        blockheight: number; // -1,
        confirmations: number; // 0,
        time: number; // 1574895240,
        valueOut: number; // 225.45779926,
        size: number; // 211,
        valueIn: number; // 225.45789926,
        fees: number; // 0.0001,
    }>(`${url}`);

    return response.data.confirmations;
};

const fetchUTXOs = (testnet: boolean) => async (address: string, confirmations: number): Promise<readonly UTXO[]> => {
    const url = `${endpoint(testnet).replace(/\/$/, "")}/address/utxo/${address}`;
    const response = await axios.get<{
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
    }>(url);
    return fixValues(response.data.utxos.map(utxo => ({
        txHash: utxo.txid,
        amount: utxo.amount,
        // script_hex: utxo.scriptPubKey,
        vOut: utxo.vout,
        confirmations: utxo.confirmations,
    }))
        .filter(utxo => confirmations === 0 || utxo.confirmations >= confirmations), 8)
        .sort(sortUTXOs);
};

export const broadcastTransaction = (testnet: boolean) => async (txHex: string): Promise<string> => {
    const url = `${endpoint(testnet).replace(/\/$/, "")}/rawtransactions/sendRawTransaction`;
    const response = await axios.post<string[]>(
        url,
        { "hexes": [txHex] },
        { timeout: 5000 }
    );
    if ((response.data as any).error) {
        throw new Error((response.data as any).error);
    }
    return response.data[0];
};

export const BitcoinDotCom = {
    fetchUTXOs,
    fetchConfirmations,
    broadcastTransaction,
};
