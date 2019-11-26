import Axios from "axios";
import BigNumber from "bignumber.js";
import https from "https";

import { retryNTimes } from "./retry";

export interface UTXO {
    readonly txid: string; // hex string without 0x prefix
    readonly value: number; // satoshis
    readonly script_hex: string; // hex string without 0x prefix
    readonly output_no: number;
    readonly confirmations: number;
}


const fixValue = (value: number, decimals: number) => new BigNumber(value).multipliedBy(new BigNumber(10).exponentiatedBy(decimals)).decimalPlaces(0).toNumber();

// Convert values to correct unit
const fixValues = (utxos: readonly UTXO[], decimals: number) => {
    return utxos.map(utxo => ({
        ...utxo,
        value: fixValue(utxo.value, decimals),
    }));
};

export const fetchFromChainSo = async (url: string) => {
    console.log("Fetching from sochain!");
    const response = await retryNTimes(
        () => Axios.get<{ readonly data: { readonly txs: readonly UTXO[] } }>(url),
        5.
    );

    return fixValues(response.data.data.txs, 8);
};

export const fetchFromBlockstream = async (url: string, getHeight: string): Promise<readonly UTXO[]> => {
    const response = await retryNTimes(
        () => Axios.get<ReadonlyArray<{
            readonly status: {
                readonly confirmed: boolean,
                readonly block_height: number,
                readonly block_hash: string,
                readonly block_time: number,
            };
            readonly txid: string;
            readonly value: number;
            readonly vout: number;
        }>>(url),
        5,
    );

    const heightResponse = await retryNTimes(
        () => Axios.get<string>(getHeight),
        5,
    );

    // tslint:disable-next-line: no-object-literal-type-assertion
    return response.data.map(utxo => ({
        txid: utxo.txid,
        value: utxo.value,
        // Placeholder
        script_hex: "76a914b0c08e3b7da084d7dbe9431e9e49fb61fb3b64d788ac",
        output_no: utxo.vout,
        confirmations: utxo.status.confirmed ? 1 + parseInt(heightResponse.data, 10) - utxo.status.block_height : 0,
    }));
};

export const fetchFromInsight = async (url: string): Promise<readonly UTXO[]> => {
    const response = await retryNTimes(
        () => Axios.get<ReadonlyArray<{
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

// export const fetchFromZechain = async (url: string): Promise<ZcashUTXO[]> => {
//     // Mainnet ZEC only!
//     const resp = await retryNTimes(
//         () => Axios.get<Array<{
//             address: string; // "t1eUHMR2k3NjZBuxmveSfee71otew7RFdwt"
//             txid: string; // "3b144316b919d01105378c0f4e3b1d3914c04d6b1ca009dae800295f1cfb35a8"
//             vout: number; // 0
//             scriptPubKey: string; // "76a914e1f180bffadc561719c64c76b2fa3efacf955e0088ac"
//             amount: number; // 0.11912954
//             satoshis: number; // 11912954
//             height: number; // 573459
//             confirmations: number; // 4
//         }>>(url),
//         5,
//     );

//     return resp.data.map((utxo) => ({
//         txid: utxo.txid,
//         value: utxo.amount,
//         script_hex: utxo.scriptPubKey,
//         output_no: utxo.vout,
//     }));
// };

export const fetchFromBitcoinDotCom = async (url: string): Promise<readonly UTXO[]> => {
    const response = await retryNTimes(
        () => Axios.get<{
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
        }>(url, {
            // TTODO: Remove when certificate is fixed.
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        }),
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

/**
 * Retrieves UTXOs for a BTC, ZEC or BCH address.
 *
 * @param network The Ren Network object
 * @param currencyName "BTC", "ZEC" or "BCH"
 *
 * @param address The BTC, ZEC or BCH address to retrieve the UTXOS for
 * @param confirmations Restrict UTXOs to having at least this many
 *        confirmations. If confirmations is 0, unconfirmed UTXOs are included.
 * @param endpoint An offset to allow trying different endpoints first, in case
 * o      one is out of sync.
 */
export const getUTXOs = (testnet: boolean, currencyName: string) => async (address: string, confirmations: number, endpoint = 0): Promise<readonly UTXO[]> => {
    const chainSoFn = () => fetchFromChainSo(`https://sochain.com/api/v2/get_tx_unspent/${currencyName}/${address}/${confirmations}`);

    // tslint:disable-next-line: readonly-array
    let endpoints: Array<() => Promise<readonly UTXO[]>> = [];
    if (currencyName.match(/btc/i)) {
        endpoints = [
            () => fetchFromBlockstream(`https://blockstream.info/${testnet ? "testnet/" : ""}api/address/${address}/utxo`, `https://blockstream.info/${testnet ? "testnet/" : ""}api/blocks/tip/height`),
            chainSoFn,
        ];
    } else if (currencyName.match(/zec/i)) {
        endpoints = [
            chainSoFn,
        ];
        if (testnet) {
            endpoints.push(() => fetchFromInsight(`https://explorer.testnet.z.cash/api/addr/${address}/utxo`));
        } else {
            endpoints.push(() => fetchFromInsight(`https://zcash.blockexplorer.com/api/addr/${address}/utxo`));
            // endpoints.push(() => fetchFromInsight(`https://zecblockexplorer.com/addr/${address}/utxo`));
            // endpoints.push(() => fetchFromZechain(`https://zechain.net/api/v1/addr/${address}/utxo`));
        }
    } else if (currencyName.match(/bch/i)) {
        if (testnet) {
            endpoints = [
                () => fetchFromBitcoinDotCom(`https://trest.bitcoin.com/v2/address/utxo/${address}`),
            ];
        } else {
            endpoints = [
                () => fetchFromBitcoinDotCom(`https://rest.bitcoin.com/v2/address/utxo/${address}`),
            ];
        }
    }

    let firstError;

    for (let i = 0; i < endpoints.length; i++) {
        try {
            const utxos = await endpoints[(i + endpoint) % endpoints.length]();
            return utxos.filter(utxo => utxo.confirmations >= confirmations);
        } catch (error) {
            firstError = firstError || error;
        }
    }

    throw firstError || new Error(`No endpoints found for retrieving ${currencyName} UTXOs.`);
};
