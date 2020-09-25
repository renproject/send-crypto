import axios from "axios";

import { fixUTXO, fixUTXOs, fixValue, sortUTXOs, UTXO } from "../../lib/utxo";
import { FetchTXsResult } from "./insight";
import { DEFAULT_TIMEOUT } from "./timeout";

export interface ScriptSig {
    hex: string;
    asm: string;
}

export interface Vin {
    txid: string; // "4f72fce028ff1e99459393232e8bf8a430815ec5cea8700676c101b02be3649c",
    vout: number; // 1,
    sequence: number; // 4294967295,
    n: number; // 0,
    scriptSig: ScriptSig;
    value: number; // 7223963,
    legacyAddress: string; // "1D4NXvNvjucShZeyLsDzYz1ky2W8gYKQH7",
    cashAddress: string; // "bitcoincash:qzzyfwmnz3dlld7svwzn53xzr6ycz5kwavpd9uqf4l"
}

export interface ScriptPubKey {
    hex: string; // "76a91427bad06158841621ed33eb91efdb1cc4af4996cb88ac",
    asm: string; // "OP_DUP OP_HASH160 27bad06158841621ed33eb91efdb1cc4af4996cb OP_EQUALVERIFY OP_CHECKSIG",
    addresses: string[]; // ["14d59YbC2D9W9y5kozabCDhxkY3eDQq7B3"],
    type: string; // "pubkeyhash",
    cashAddrs: string[]; // ["bitcoincash:qqnm45rptzzpvg0dx04erm7mrnz27jvkevaf3ys3c5"]
}

export interface Vout {
    value: string; // "0.04159505",
    n: number; // 0,
    scriptPubKey: ScriptPubKey;
    spentTxId: string; // "9fa7bc86ad4729cbd5c182a8cd5cfc5eb457608fe430ce673f33ca52bfb1a187",
    spentIndex: number; // 1,
    spentHeight: number; // 617875
}

export interface QueryTransaction {
    vin: Vin[];
    vout: Vout[];
    txid: string; // "03e29b07bb98b1e964296289dadb2fb034cb52e178cc306d20cc9ddc951d2a31",
    version: number; // 1,
    locktime: number; // 0,
    blockhash: string; // "0000000000000000011c71094699e3ba47c43da76d775cf5eb5fbea1787fafb5",
    blockheight: number; // 616200,
    confirmations: number; // 27433,
    time: number; // 1578054427,
    blocktime: number; // 1578054427,
    firstSeenTime: number; // 1578054360,
    valueOut: number; // 0.07213963,
    size: number; // 226,
    valueIn: number; // 0.07223963,
    fees: number; // 0.0001
}

const endpoint = (testnet: boolean) =>
    testnet ? "https://trest.bitcoin.com/v2/" : "https://rest.bitcoin.com/v2/";

const fetchUTXO = (testnet: boolean) => async (
    txHash: string,
    vOut: number
): Promise<UTXO> => {
    const url = `${endpoint(testnet).replace(
        /\/$/,
        ""
    )}/transaction/details/${txHash}`;

    const response = await axios.get<QueryTransaction>(`${url}`, {
        timeout: DEFAULT_TIMEOUT,
    });

    const utxo = response.data;

    return fixUTXO(
        {
            txHash,
            amount: parseFloat(utxo.vout[vOut].value),
            // script_hex: utxo.scriptPubKey,
            vOut,
            confirmations: utxo.confirmations,
        },
        8
    );
};

interface FetchUTXOs {
    utxos: ReadonlyArray<{
        address: string;
        txid: string;
        vout: number;
        scriptPubKey: string;
        amount: number;
        satoshis: number;
        confirmations: number;
        ts: number;
    }>;
}

const fetchUTXOs = (testnet: boolean) => async (
    address: string,
    confirmations: number
): Promise<readonly UTXO[]> => {
    const url = `${endpoint(testnet).replace(
        /\/$/,
        ""
    )}/address/utxo/${address}`;
    const response = await axios.get<FetchUTXOs>(url, {
        timeout: DEFAULT_TIMEOUT,
    });
    return fixUTXOs(
        response.data.utxos
            .map((utxo) => ({
                txHash: utxo.txid,
                amount: utxo.amount,
                // script_hex: utxo.scriptPubKey,
                vOut: utxo.vout,
                confirmations: utxo.confirmations,
            }))
            .filter(
                (utxo) =>
                    confirmations === 0 || utxo.confirmations >= confirmations
            ),
        8
    ).sort(sortUTXOs);
};

const fetchTXs = (testnet: boolean) => async (
    address: string,
    confirmations: number
): Promise<readonly UTXO[]> => {
    const url = `${endpoint(testnet).replace(
        /\/$/,
        ""
    )}/address/transactions/${address}`;
    const { data } = await axios.get<FetchTXsResult>(url, {
        timeout: DEFAULT_TIMEOUT,
    });

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

export const broadcastTransaction = (testnet: boolean) => async (
    txHex: string
): Promise<string> => {
    const url = `${endpoint(testnet).replace(
        /\/$/,
        ""
    )}/rawtransactions/sendRawTransaction`;
    const response = await axios.post<string[]>(
        url,
        { hexes: [txHex] },
        { timeout: DEFAULT_TIMEOUT }
    );
    if ((response.data as any).error) {
        throw new Error((response.data as any).error);
    }
    return response.data[0];
};

export const BitcoinDotCom = {
    fetchUTXO,
    fetchUTXOs,
    fetchTXs,
    broadcastTransaction,
};
