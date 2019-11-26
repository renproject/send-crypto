
import axios from "axios";

import { UTXO } from "../lib/mercury";
import { retryNTimes } from "../lib/retry";

interface BlockstreamUTXO<vout = number> {
    readonly status: {
        readonly confirmed: false,
    } | {
        readonly confirmed: true,
        readonly block_height: number,
        readonly block_hash: string,
        readonly block_time: number,
    };
    readonly txid: string;
    readonly value: number;
    readonly vout: vout;
};

interface BlockstreamDetailsUTXO extends BlockstreamUTXO<Array<{
    scriptpubkey: string,
    scriptpubkey_asm: string,
    scriptpubkey_type: string,
    scriptpubkey_address: string,
    value: number,
}>> {
    locktime: number;
    vin: Array<{
        txid: string,
        vout: number,
        prevout: any,
        scriptsig: string,
        scriptsig_asm: string,
        is_coinbase: false,
        sequence: number,
    }>,
    size: number,
    weight: number,
    fee: number,
}


const fetchConfirmations = async (txid: string, testnet: boolean): Promise<number> => {
    const apiUrl = `https://blockstream.info/${testnet ? "testnet/" : ""}api`;

    const response = await retryNTimes(
        () => axios.get<BlockstreamDetailsUTXO>(`${apiUrl}/tx/${txid}`),
        5,
    );

    const heightResponse = () => retryNTimes(
        () => axios.get<string>(`${apiUrl}/blocks/tip/height`),
        5,
    );

    const utxo = response.data;
    return utxo.status.confirmed ? 1 + parseInt((await heightResponse()).data, 10) - utxo.status.block_height : 0;
};

const fetchUTXOs = async (address: string, confirmations: number, testnet: boolean): Promise<readonly UTXO[]> => {
    const apiUrl = `https://blockstream.info/${testnet ? "testnet/" : ""}api`;

    const response = await retryNTimes(
        () => axios.get<ReadonlyArray<{
            readonly status: {
                readonly confirmed: boolean,
                readonly block_height: number,
                readonly block_hash: string,
                readonly block_time: number,
            };
            readonly txid: string;
            readonly value: number;
            readonly vout: number;
        }>>(`${apiUrl}/address/${address}/utxo`),
        5,
    );

    const heightResponse = await retryNTimes(
        () => axios.get<string>(`${apiUrl}/blocks/tip/height`),
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
    })).filter(utxo => utxo.confirmations >= confirmations);
};


const broadcastTransaction = async (txHex: string, testnet: boolean): Promise<string> => {
    const response = await retryNTimes(() => axios.post<string>("https://blockstream.info/testnet/api/tx", txHex), 2);
    return response.data;
};

export const Blockstream = {
    fetchConfirmations,
    fetchUTXOs,
    broadcastTransaction,
}