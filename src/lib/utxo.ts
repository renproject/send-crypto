import BigNumber from "bignumber.js";

export interface UTXO {
    readonly txid: string; // hex string without 0x prefix
    readonly value: number; // satoshis
    readonly script_hex?: string; // hex string without 0x prefix
    readonly output_no: number;
    readonly confirmations: number;
}

export const sortUTXOs = (a: UTXO, b: UTXO) => {
    // Sort greater values first
    if (a.value !== b.value) { return b.value - a.value };
    // Sort older UTXOs first
    if (a.confirmations !== b.confirmations) { return a.value - b.value }
    return a.txid <= b.txid ? -1 : 1;
}

export const fixValue = (value: number, decimals: number) => new BigNumber(value).multipliedBy(new BigNumber(10).exponentiatedBy(decimals)).decimalPlaces(0).toNumber();

// Convert values to correct unit
export const fixValues = (utxos: readonly UTXO[], decimals: number) => {
    return utxos.map(utxo => ({
        ...utxo,
        value: fixValue(utxo.value, decimals),
    }));
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
export const getUTXOs = (testnet: boolean, currencyName: string, endpoints: Array<() => Promise<readonly UTXO[]>>) => async (address: string, confirmations: number, endpoint = 0): Promise<readonly UTXO[]> => {
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