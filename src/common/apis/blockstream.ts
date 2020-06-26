
import axios from "axios";

import { sortUTXOs, UTXO } from "../../lib/utxo";
import { DEFAULT_TIMEOUT } from "./timeout";

interface BlockstreamUTXO<vout = number> {
    status: {
        confirmed: false,
    } | {
        confirmed: true,
        block_height: number,
        block_hash: string,
        block_time: number,
    };
    txid: string;
    value: number;
    vout: vout;
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


const fetchConfirmations = (testnet: boolean) => async (txid: string): Promise<number> => {
    const apiUrl = `https://blockstream.info/${testnet ? "testnet/" : ""}api`;

    const response = await axios.get<BlockstreamDetailsUTXO>(`${apiUrl}/tx/${txid}`, { timeout: DEFAULT_TIMEOUT });

    const heightResponse = () => axios.get<string>(`${apiUrl}/blocks/tip/height`, { timeout: DEFAULT_TIMEOUT });

    const utxo = response.data;
    return utxo.status.confirmed ? 1 + parseInt((await heightResponse()).data, 10) - utxo.status.block_height : 0;
};

const fetchUTXOs = (testnet: boolean) => async (address: string, confirmations: number): Promise<readonly UTXO[]> => {
    const apiUrl = `https://blockstream.info/${testnet ? "testnet/" : ""}api`;

    const response = await axios.get<ReadonlyArray<{
        status: {
            confirmed: boolean,
            block_height: number,
            block_hash: string,
            block_time: number,
        };
        txid: string,
        value: number,
        vout: number,
    }>>(`${apiUrl}/address/${address}/utxo`, { timeout: DEFAULT_TIMEOUT });

    const heightResponse = await axios.get<string>(`${apiUrl}/blocks/tip/height`, { timeout: DEFAULT_TIMEOUT });

    return response.data.map(utxo => ({
        txHash: utxo.txid,
        amount: utxo.value,
        vOut: utxo.vout,
        confirmations: utxo.status.confirmed ? 1 + parseInt(heightResponse.data, 10) - utxo.status.block_height : 0,
    }))
        .filter(utxo => confirmations === 0 || utxo.confirmations >= confirmations)
        .sort(sortUTXOs);
};


const broadcastTransaction = (testnet: boolean) => async (txHex: string): Promise<string> => {
    const response = await axios.post<string>(`https://blockstream.info/${testnet ? "testnet/" : ""}api/tx`, txHex, { timeout: DEFAULT_TIMEOUT });
    return response.data;
};

export const Blockstream = {
    fetchConfirmations,
    fetchUTXOs,
    broadcastTransaction,
}