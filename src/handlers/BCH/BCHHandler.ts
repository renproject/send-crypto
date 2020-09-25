import * as bitcoin from "bitgo-utxo-lib";

import { toCashAddress, toLegacyAddress } from "bchaddrjs";
import BigNumber from "bignumber.js";
import { List } from "immutable";

import { BitcoinDotCom } from "../../common/apis/bitcoinDotCom";
import { Blockchair } from "../../common/apis/blockchair";
import { BitgoUTXOLib } from "../../common/libraries/bitgoUtxoLib";
import { subscribeToConfirmations } from "../../lib/confirmations";
import { newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { fallback, retryNTimes } from "../../lib/retry";
import { UTXO } from "../../lib/utxo";
import { Asset, Handler } from "../../types/types";

interface AddressOptions {}
interface BalanceOptions extends AddressOptions {
    address?: string;
    confirmations?: number; // defaults to 0
}
interface TxOptions extends BalanceOptions {
    fee?: number; // defaults to 10000
    subtractFee?: boolean; // defaults to false
}

const toCashAddr = (legacyAddress: string) => {
    try {
        return toCashAddress(legacyAddress);
    } catch (error) {
        return legacyAddress;
    }
};

export const _apiFallbacks = {
    fetchUTXO: (testnet: boolean, txHash: string, vOut: number) => [
        () => BitcoinDotCom.fetchUTXO(testnet)(txHash, vOut),
        testnet
            ? undefined
            : () =>
                  Blockchair.fetchUTXO(Blockchair.networks.BITCOIN_CASH)(
                      txHash,
                      vOut
                  ),
    ],

    fetchUTXOs: (testnet: boolean, address: string, confirmations: number) => [
        () => BitcoinDotCom.fetchUTXOs(testnet)(address, confirmations),
        testnet
            ? undefined
            : () =>
                  Blockchair.fetchUTXOs(Blockchair.networks.BITCOIN_CASH)(
                      address,
                      confirmations
                  ),
    ],

    fetchTransactions: (
        testnet: boolean,
        address: string,
        confirmations: number = 0
    ) => [
        () => BitcoinDotCom.fetchTXs(testnet)(address, confirmations),
        testnet
            ? undefined
            : () =>
                  Blockchair.fetchTXs(Blockchair.networks.BITCOIN_CASH)(
                      address,
                      confirmations
                  ),
    ],

    broadcastTransaction: (testnet: boolean, hex: string) => [
        () => BitcoinDotCom.broadcastTransaction(testnet)(hex),
        testnet
            ? undefined
            : () =>
                  Blockchair.broadcastTransaction(
                      Blockchair.networks.BITCOIN_CASH
                  )(hex),
    ],
};

export class BCHHandler implements Handler {
    private readonly privateKey: { getAddress: () => string };
    private readonly testnet: boolean;

    private readonly decimals = 8;

    static getUTXOs = async (
        testnet: boolean,
        options: { address: string; confirmations?: number }
    ): Promise<readonly UTXO[]> => {
        const address = toCashAddr(options.address);
        const confirmations = options.confirmations || 0;

        const endpoints = _apiFallbacks.fetchUTXOs(
            testnet,
            address,
            confirmations
        );
        const utxos = await retryNTimes(() => fallback(endpoints), 2);
        return utxos;
    };

    static getUTXO = async (
        testnet: boolean,
        txHash: string,
        vOut: number
    ): Promise<UTXO> => {
        const endpoints = _apiFallbacks.fetchUTXO(testnet, txHash, vOut);
        return retryNTimes(() => fallback(endpoints), 2);
    };

    static getTransactions = async (
        testnet: boolean,
        options: { address: string; confirmations?: number }
    ): Promise<readonly UTXO[]> => {
        const address = toCashAddr(options.address);
        const confirmations =
            options && options.confirmations !== undefined
                ? options.confirmations
                : 0;

        const endpoints = _apiFallbacks.fetchUTXOs(
            testnet,
            address,
            confirmations
        );
        return retryNTimes(() => fallback(endpoints), 2);
    };

    constructor(privateKey: string, network: string) {
        this.testnet = network !== "mainnet";
        this.privateKey = BitgoUTXOLib.loadPrivateKey(
            this._bitgoNetwork(),
            privateKey
        );
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        typeof asset === "string" &&
        ["BCH", "BITCOIN CASH", "BCASH", "BITCOINCASH", "BITCOIN-CASH"].indexOf(
            asset.toUpperCase()
        ) !== -1;

    public readonly address = async (
        asset: Asset,
        options?: AddressOptions
    ): Promise<string> => toCashAddr(this.privateKey.getAddress());

    // Balance
    public readonly getBalance = async (
        asset: Asset,
        options?: BalanceOptions
    ): Promise<BigNumber> =>
        (await this.getBalanceInSats(asset, options)).dividedBy(
            new BigNumber(10).exponentiatedBy(this.decimals)
        );

    public readonly getBalanceInSats = async (
        asset: Asset,
        options?: BalanceOptions
    ): Promise<BigNumber> => {
        const utxos = await BCHHandler.getUTXOs(this.testnet, {
            ...options,
            address:
                (options && options.address) || (await this.address(asset)),
        });
        return utxos.reduce(
            (sum, utxo) => sum.plus(utxo.amount),
            new BigNumber(0)
        );
    };

    // Transfer
    public readonly send = (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: TxOptions
    ): PromiEvent<string> =>
        this.sendSats(
            to,
            value.times(new BigNumber(10).exponentiatedBy(this.decimals)),
            asset,
            options
        );

    public readonly sendSats = (
        to: string,
        valueIn: BigNumber,
        asset: Asset,
        options?: TxOptions
    ): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>();

        let txHash: string;
        let errored: boolean;

        (async () => {
            const fromAddress = toLegacyAddress(await this.address(asset));
            const toAddress = toLegacyAddress(to);
            const changeAddress = fromAddress;
            const utxos = List(
                await BCHHandler.getUTXOs(this.testnet, {
                    ...options,
                    address: fromAddress,
                })
            )
                .sortBy((utxo) => utxo.amount)
                .reverse()
                .toArray();

            const built = await BitgoUTXOLib.buildUTXO(
                this._bitgoNetwork(),
                this.privateKey,
                changeAddress,
                toAddress,
                valueIn,
                utxos,
                {
                    ...options,
                    signFlag:
                        // tslint:disable-next-line: no-bitwise
                        bitcoin.Transaction.SIGHASH_SINGLE |
                        bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143,
                }
            );

            txHash = await retryNTimes(
                () =>
                    fallback(
                        _apiFallbacks.broadcastTransaction(
                            this.testnet,
                            built.toHex()
                        )
                    ),
                3
            );

            promiEvent.emit("transactionHash", txHash);
            promiEvent.resolve(txHash);
        })().catch((error) => {
            errored = true;
            promiEvent.reject(error);
        });

        subscribeToConfirmations(
            promiEvent,
            () => errored,
            async () => (txHash ? this._getConfirmations(txHash) : 0)
        );

        return promiEvent;
    };

    private readonly _getConfirmations = (txHash: string): Promise<number> =>
        retryNTimes(
            async () =>
                (
                    await fallback(
                        // Fetch confirmations for first output of transaction.
                        _apiFallbacks.fetchUTXO(this.testnet, txHash, 0)
                    )
                ).confirmations,
            2
        );

    private readonly _bitgoNetwork = () =>
        this.testnet
            ? bitcoin.networks.bitcoincashTestnet
            : bitcoin.networks.bitcoincash;
}
