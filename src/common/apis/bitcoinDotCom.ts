import axios from "axios";

import { fixValues, sortUTXOs, UTXO } from "../../lib/utxo";
import { DEFAULT_TIMEOUT } from "./timeout";

const endpoint = (testnet: boolean) => testnet ? "https://trest.bitcoin.com/v2/" : "https://rest.bitcoin.com/v2/";

const fetchConfirmations = (testnet: boolean) => async (txid: string): Promise<number> => {
    const url = `${endpoint(testnet).replace(/\/$/, "")}/transaction/details/${txid}`;

    const response = await axios.get<{
        txid: string, // 'cacec549d9f1f67e9835889a2ce3fc0d593bd78d63f63f45e4c28a59e004667d',
        version: number, // 4,
        locktime: number, // 0,
        vin: any, // [[Object]],
        vout: any, // [[Object]],
        blockhash: string, // -1,
        blockheight: number, // -1,
        confirmations: number, // 0,
        time: number, // 1574895240,
        valueOut: number, // 225.45779926,
        size: number, // 211,
        valueIn: number, // 225.45789926,
        fees: number, // 0.0001,
    }>(`${url}`, { timeout: DEFAULT_TIMEOUT });

    return response.data.confirmations;
};

const fetchUTXOs = (testnet: boolean) => async (address: string, confirmations: number): Promise<readonly UTXO[]> => {
    const url = `${endpoint(testnet).replace(/\/$/, "")}/address/utxo/${address}`;
    const response = await axios.get<{
        utxos: ReadonlyArray<{
            address: string,
            txid: string,
            vout: number,
            scriptPubKey: string,
            amount: number,
            satoshis: number,
            confirmations: number,
            ts: number,
        }>
    }>(url, { timeout: DEFAULT_TIMEOUT });
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
        { timeout: DEFAULT_TIMEOUT }
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
