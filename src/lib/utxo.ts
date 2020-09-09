import BigNumber from "bignumber.js";

export interface UTXO {
    readonly txHash: string; // hex string without 0x prefix
    readonly vOut: number;
    readonly amount: number; // satoshis
    readonly scriptPubKey?: string; // hex string without 0x prefix
    readonly confirmations: number;
}

/**
 * sortUTXOs compares two UTXOs by amount, then confirmations and then hash.
 *
 * @example
 * sortUTXOs({amount: 1, confirmations: 1}, {amount: 2, confirmations: 0});
 * // -1, representing that the first parameter should be ordered first.
 *
 * @returns a negative value to represent that a should come before b or a
 * positive value to represent that b should come before a.
 */
export const sortUTXOs = (a: UTXO, b: UTXO): number => {
    // Sort greater values first
    if (a.amount !== b.amount) {
        return b.amount - a.amount;
    }
    // Sort older UTXOs first
    if (a.confirmations !== b.confirmations) {
        return a.confirmations - b.confirmations;
    }
    return a.txHash <= b.txHash ? -1 : 1;
};

/**
 * fixValue turns a readable value, e.g. `0.0001` BTC, to the value in the smallest
 * unit, e.g. `10000` sats.
 *
 * @example
 * fixValue(0.0001, 8) = 10000;
 *
 * @param value Value in the readable representation, e.g. `0.0001` BTC.
 * @param decimals The number of decimals to shift by, e.g. 8.
 */
export const fixValue = (value: number, decimals: number) =>
    new BigNumber(value)
        .multipliedBy(new BigNumber(10).exponentiatedBy(decimals))
        .decimalPlaces(0)
        .toNumber();

/**
 * fixUTXO calls {{fixValue}} on the value of the UTXO.
 */
export const fixUTXO = (utxo: UTXO, decimals: number): UTXO => ({
    ...utxo,
    amount: fixValue(utxo.amount, decimals),
});

/**
 * fixUTXOs maps over an array of UTXOs and calls {{fixValue}}.
 */
export const fixUTXOs = (utxos: readonly UTXO[], decimals: number) => {
    return utxos.map((utxo) => fixUTXO(utxo, decimals));
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
export const getUTXOs = (
    testnet: boolean,
    currencyName: string,
    endpoints: Array<() => Promise<readonly UTXO[]>>
) => async (
    address: string,
    confirmations: number,
    endpoint = 0
): Promise<readonly UTXO[]> => {
    let firstError;

    for (let i = 0; i < endpoints.length; i++) {
        try {
            const utxos = await endpoints[(i + endpoint) % endpoints.length]();
            return utxos.filter((utxo) => utxo.confirmations >= confirmations);
        } catch (error) {
            firstError = firstError || error;
        }
    }

    throw (
        firstError ||
        new Error(`No endpoints found for retrieving ${currencyName} UTXOs.`)
    );
};
