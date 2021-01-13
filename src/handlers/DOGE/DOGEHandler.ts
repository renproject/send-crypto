import { Blockchair } from "../../common/apis/blockchair";
import { Sochain } from "../../common/apis/sochain";
import { fallback, onlyMainnet } from "../../lib/retry";
import { shuffleArray } from "../../lib/utils";
import { UTXO } from "../../lib/utxo";

export const _apiFallbacks = {
    fetchUTXO: (testnet: boolean, txHash: string, vOut: number) => [
        () => Sochain.fetchUTXO(testnet ? "DOGETEST" : "DOGE")(txHash, vOut),
        ...shuffleArray(
            onlyMainnet(
                () =>
                    Blockchair.fetchUTXO(Blockchair.networks.DOGECOIN)(
                        txHash,
                        vOut
                    ),
                true
            )
        ),
    ],

    fetchUTXOs: (testnet: boolean, address: string, confirmations: number) => [
        () =>
            Sochain.fetchUTXOs(testnet ? "DOGETEST" : "DOGE")(
                address,
                confirmations
            ),
        ...shuffleArray(
            onlyMainnet(
                () =>
                    Blockchair.fetchUTXOs(Blockchair.networks.DOGECOIN)(
                        address,
                        confirmations
                    ),
                testnet
            )
        ),
    ],

    fetchTXs: (
        testnet: boolean,
        address: string,
        confirmations: number = 0
    ) => [
        () =>
            Sochain.fetchTXs(testnet ? "DOGETEST" : "DOGE")(
                address,
                confirmations
            ),
        ...shuffleArray(
            onlyMainnet(
                () =>
                    Blockchair.fetchTXs(Blockchair.networks.DOGECOIN)(
                        address,
                        confirmations
                    ),
                testnet
            )
        ),
    ],

    broadcastTransaction: (testnet: boolean, hex: string) => [
        () => Sochain.broadcastTransaction(testnet ? "DOGETEST" : "DOGE")(hex),
        ...shuffleArray(
            onlyMainnet(
                () =>
                    Blockchair.broadcastTransaction(
                        Blockchair.networks.DOGECOIN
                    )(hex),
                testnet
            )
        ),
    ],
};

export class DOGEHandler {
    static getUTXOs = async (
        testnet: boolean,
        options: { address: string; confirmations?: number }
    ): Promise<readonly UTXO[]> => {
        const confirmations =
            options && options.confirmations !== undefined
                ? options.confirmations
                : 0;

        const endpoints = _apiFallbacks.fetchUTXOs(
            testnet,
            options.address,
            confirmations
        );
        return fallback(endpoints);
    };

    static getUTXO = async (
        testnet: boolean,
        txHash: string,
        vOut: number
    ): Promise<UTXO> => {
        const endpoints = _apiFallbacks.fetchUTXO(testnet, txHash, vOut);
        return fallback(endpoints);
    };

    static getTransactions = async (
        testnet: boolean,
        options: { address: string; confirmations?: number }
    ): Promise<readonly UTXO[]> => {
        const confirmations =
            options && options.confirmations !== undefined
                ? options.confirmations
                : 0;

        const endpoints = _apiFallbacks.fetchTXs(
            testnet,
            options.address,
            confirmations
        );
        return fallback(endpoints);
    };
}
