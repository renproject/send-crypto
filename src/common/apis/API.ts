import BigNumber from "bignumber.js";

export interface UTXO {
    readonly txHash: string; // hex string without 0x prefix
    readonly vOut: number;
    readonly amount: BigNumber; // in sats
    readonly confirmations: number;
}

export interface API {
    fetchUTXO?: (txHash: string, vOut: number) => Promise<UTXO>;
    fetchUTXOs?: (address: string, confirmations: number) => Promise<UTXO[]>;
    fetchTXs?: (address: string, confirmations?: number) => Promise<UTXO[]>;
    broadcastTransaction?: (hex: string) => Promise<string>;
}
