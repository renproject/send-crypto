import axios from "axios";
import https from "https";

import { fixUTXO, fixValue, sortUTXOs, UTXO } from "../../lib/utxo";
import { DEFAULT_TIMEOUT } from "./timeout";

const fetchUTXOs = (insightURL: string) => async (
    address: string,
    confirmations: number
): Promise<readonly UTXO[]> => {
    const url = `${insightURL.replace(/\/$/, "")}/addr/${address}/utxo`;
    const response = await axios.get<FetchUTXOResult>(url, {
        // TODO: Remove when certificate is fixed.
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
        }),
        timeout: DEFAULT_TIMEOUT,
    });

    const data: FetchUTXOResult =
        typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;

    return data
        .map((utxo) => ({
            txHash: utxo.txid,
            amount: utxo.satoshis || fixValue(utxo.amount, 8),
            // script_hex: utxo.scriptPubKey,
            vOut: utxo.vout,
            confirmations: utxo.confirmations,
        }))
        .filter(
            (utxo) => confirmations === 0 || utxo.confirmations >= confirmations
        )
        .sort(sortUTXOs);
};

const fetchTXs = (insightURL: string) => async (
    address: string,
    confirmations: number
): Promise<readonly UTXO[]> => {
    const url = `${insightURL.replace(/\/$/, "")}/txs/?address=${address}`;
    const response = await axios.get<FetchTXsResult>(url, {
        // TODO: Remove when certificate is fixed.
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
        }),
        timeout: DEFAULT_TIMEOUT,
    });

    const data: FetchTXsResult =
        typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;

    const received: UTXO[] = [];

    for (const tx of data.txs) {
        for (let i = 0; i < tx.vout.length; i++) {
            const vout = tx.vout[i];
            if (vout.scriptPubKey.addresses.indexOf(address) >= 0) {
                received.push({
                    txHash: tx.txid,
                    amount: fixValue(parseFloat(vout.value), 8),
                    vOut: i,
                    confirmations: tx.confirmations,
                });
            }
        }
    }

    return received
        .filter(
            (utxo) => confirmations === 0 || utxo.confirmations >= confirmations
        )
        .sort(sortUTXOs);
};

const fetchUTXO = (insightURL: string) => async (
    txHash: string,
    vOut: number
): Promise<UTXO> => {
    const url = `${insightURL.replace(/\/$/, "")}/tx/${txHash}`;
    const tx = (await axios.get<TxResponse>(url, { timeout: DEFAULT_TIMEOUT }))
        .data;
    return fixUTXO(
        {
            txHash,
            amount: parseFloat(tx.vout[vOut].value),
            vOut,
            confirmations: tx.confirmations,
        },
        8
    );
};

export const broadcastTransaction = (insightURL: string) => async (
    txHex: string
): Promise<string> => {
    const url = `${insightURL.replace(/\/$/, "")}/tx/send`;
    const response = await axios.post<{
        error: string | null;
        id: null;
        txid: string;
    }>(url, { rawtx: txHex }, { timeout: DEFAULT_TIMEOUT });
    if (response.data.error) {
        throw new Error(response.data.error);
    }
    return response.data.txid;
};

export const Insight = {
    fetchUTXO,
    fetchUTXOs,
    fetchTXs,
    broadcastTransaction,
};

export interface ScriptSig {
    hex: string;
    asm: string;
}

export interface Vin {
    txid: string;
    vout: number;
    sequence: number;
    n: number;
    scriptSig: ScriptSig;
    addr: string;
    valueSat: number;
    value: number;
    doubleSpentTxID?: any;
}

export interface ScriptPubKey {
    hex: string; // "76a914ea06cb7aaf2b21e97ea9f43736731ee6a33366db88ac",
    asm: string; // "OP_DUP OP_HASH160 ea06cb7aaf2b21e97ea9f43736731ee6a33366db OP_EQUALVERIFY OP_CHECKSIG",
    addresses: string[]; // ["tmX3mbB2iAtGftpyp4BTmryma2REmuw8h8G"]
    type: string; // "pubkeyhash"
}

export interface Vout {
    value: string; // "0.00020000",
    n: number; // 0,
    scriptPubKey: ScriptPubKey;
    spentTxId: string; // "265760587a0631d613f13949a45bef1ec4c5fc38912081f4b58b4df51799ffb5",
    spentIndex: number; // 0,
    spentHeight: number; // 756027
}

export interface TxResponse {
    txid: string; // "fcc25c1a1f7df38ce15211b324385d837540dc0a97c3056f7497dacabef77c3f",
    version: number; // 4,
    locktime: number; // 0,
    vin: Vin[];
    vout: Vout[];
    vjoinsplit: any[]; // [],
    blockhash: string; // "0029b9051d06402b546532c1d0288684368fce5cc42c0b3e5aa032a35b74014b",
    blockheight: number; // 735468,
    confirmations: number; // 259430,
    time: number; // 1577073296,
    blocktime: number; // 1577073296,
    valueOut: number; // 0.0002,
    size: number; // 211,
    valueIn: number; // 0.0003,
    fees: number; // 0.0001,
    fOverwintered: boolean; // true,
    nVersionGroupId: number; // 2301567109,
    nExpiryHeight: number; // 0,
    valueBalance: number; // 0,
    spendDescs: any[]; // [],
    outputDescs: any[]; // []
}

export interface FetchTXsResult {
    pagesTotal: number;
    txs: TxResponse[];
}

type FetchUTXOResult = ReadonlyArray<{
    address: string;
    txid: string;
    vout: number;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    confirmations: number;
    ts: number;
}>;
