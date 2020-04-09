import axios from "axios";

import { fixValues, sortUTXOs, UTXO } from "../../lib/utxo";

export interface SoChainUTXO {
    txid: string; // hex string without 0x prefix
    value: number; // satoshis
    script_asm: string;
    script_hex: string; // hex string without 0x prefix
    output_no: number;
    confirmations: number;
    time: number;
}

const fetchUTXOs = (network: string) => async (address: string, confirmations: number) => {
    const url = `https://sochain.com/api/v2/get_tx_unspent/${network}/${address}/${confirmations}`;
    const response = await axios.get<{ readonly data: { readonly txs: readonly SoChainUTXO[] } }>(url);

    return fixValues(response.data.data.txs.map(utxo => ({
        txHash: utxo.txid,
        amount: utxo.value,
        scriptPubKey: utxo.script_hex,
        vOut: utxo.output_no,
        confirmations: utxo.confirmations,
    })), 8)
        .filter(utxo => confirmations === 0 || utxo.confirmations >= confirmations)
        .sort(sortUTXOs);
};

const broadcastTransaction = (network: string) => async (txHex: string): Promise<string> => {
    const response = await axios.post<{
        readonly status: "success";
        readonly data: {
            readonly network: string;
            readonly txid: string; // Hex without 0x
        }
    }>(`https://chain.so/send_tx/${network}`, { tx_hex: txHex });
    return response.data.data.txid;
};

export const Sochain = {
    fetchUTXOs,
    broadcastTransaction,
}
