import axios from "axios";
import https from "https";

import { fixValue, sortUTXOs, UTXO } from "../../lib/utxo";
import { DEFAULT_TIMEOUT } from "./timeout";

type FetchUTXOResult = ReadonlyArray<{
    address: string,
    txid: string,
    vout: number,
    scriptPubKey: string,
    amount: number,
    satoshis: number,
    confirmations: number,
    ts: number,
}>;

const fetchUTXOs = (insightURL: string) => async (address: string, confirmations: number): Promise<readonly UTXO[]> => {
    const url = `${insightURL.replace(/\/$/, "")}/addr/${address}/utxo`;
    const response = await axios.get<FetchUTXOResult>(url, {
        // TODO: Remove when certificate is fixed.
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        timeout: DEFAULT_TIMEOUT,
    });

    const data: FetchUTXOResult = typeof response.data === "string" ? JSON.parse(response.data) : response.data;

    return data.map(utxo => ({
        txHash: utxo.txid,
        amount: utxo.satoshis || fixValue(utxo.amount, 8),
        // script_hex: utxo.scriptPubKey,
        vOut: utxo.vout,
        confirmations: utxo.confirmations,
    }))
        .filter(utxo => confirmations === 0 || utxo.confirmations >= confirmations)
        .sort(sortUTXOs);
};

const fetchConfirmations = (insightURL: string) => async (txid: string): Promise<number> => {
    const url = `${insightURL.replace(/\/$/, "")}/tx/${txid}`;

    const response = await axios.get<{
        txid: string, // 'cacec549d9f1f67e9835889a2ce3fc0d593bd78d63f63f45e4c28a59e004667d',
        version: number, // 4,
        locktime: number, // 0,
        vin: any, // [[Object]],
        vout: any, // [[Object]],
        vjoinsplit: any[], // [],
        blockheight: number, // -1,
        confirmations: number, // 0,
        time: number, // 1574895240,
        valueOut: number, // 225.45779926,
        size: number, // 211,
        valueIn: number, // 225.45789926,
        fees: number, // 0.0001,
        fOverwintered: boolean, // true,
        nVersionGroupId: number, // 2301567109,
        nExpiryHeight: number, // 0,
        valueBalance: number, // 0,
        spendDescs: any[], // [],
        outputDescs: any[], // []
    }>(url, { timeout: DEFAULT_TIMEOUT });

    return response.data.confirmations;
};

export const broadcastTransaction = (insightURL: string) => async (txHex: string): Promise<string> => {
    const url = `${insightURL.replace(/\/$/, "")}/tx/send`;
    const response = await axios.post<{ error: string | null, id: null, txid: string }>(
        url,
        { rawtx: txHex },
        { timeout: DEFAULT_TIMEOUT }
    );
    if (response.data.error) {
        throw new Error(response.data.error);
    }
    return response.data.txid;
};

export const Insight = {
    fetchUTXOs,
    fetchConfirmations,
    broadcastTransaction,
}