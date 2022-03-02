import { toCashAddress, toLegacyAddress } from "bchaddrjs";
import BigNumber from "bignumber.js";
import * as bitcoin from "bitgo-utxo-lib";
import { List } from "immutable";

import { BitcoinDotCom } from "../../common/apis/bitcoinDotCom";
import { Blockchain, BlockchainNetwork } from "../../common/apis/blockchain";
import { Blockchair } from "../../common/apis/blockchair";
import { Insight } from "../../common/apis/insight";
import { JSONRPC, MULTICHAIN_URLS } from "../../common/apis/jsonrpc";
import { BitgoUTXOLib } from "../../common/libraries/bitgoUtxoLib";
import { subscribeToConfirmations } from "../../lib/confirmations";
import { newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { fallback, retryNTimes } from "../../lib/retry";
import { UTXO } from "../../lib/utxo";
import { Asset, Handler } from "../../types/types";

const testnetInsight = "https://api.bitcore.io/api/BCH/testnet/";
const mainnetInsight = "https://api.bitcore.io/api/BCH/mainnet/";

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
    } catch (error: any) {
        return legacyAddress;
    }
};

export const _apiFallbacks = {
    fetchUTXO: (testnet: boolean, txHash: string, vOut: number) => [
        () =>
            Blockchain.fetchUTXO(
                testnet
                    ? BlockchainNetwork.BitcoinCashTestnet
                    : BlockchainNetwork.BitcoinCash
            )(txHash, vOut),
        () =>
            Insight.fetchUTXO(testnet ? testnetInsight : mainnetInsight)(
                txHash,
                vOut
            ),
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
        () =>
            Blockchain.fetchUTXOs(
                testnet
                    ? BlockchainNetwork.BitcoinCashTestnet
                    : BlockchainNetwork.BitcoinCash
            )(address, confirmations),
        () =>
            Insight.fetchUTXOs(testnet ? testnetInsight : mainnetInsight)(
                address,
                confirmations
            ),
        () => BitcoinDotCom.fetchUTXOs(testnet)(address, confirmations),
        testnet
            ? undefined
            : () =>
                  Blockchair.fetchUTXOs(Blockchair.networks.BITCOIN_CASH)(
                      address,
                      confirmations
                  ),
    ],

    fetchTXs: (
        testnet: boolean,
        address: string,
        confirmations: number = 0
    ) => [
        () =>
            Blockchain.fetchTXs(
                testnet
                    ? BlockchainNetwork.BitcoinCashTestnet
                    : BlockchainNetwork.BitcoinCash
            )(address, confirmations),
        () =>
            Insight.fetchTXs(testnet ? testnetInsight : mainnetInsight)(
                address,
                confirmations
            ),
        // () => BitcoinDotCom.fetchTXs(testnet)(address, confirmations),
        testnet
            ? undefined
            : () =>
                  Blockchair.fetchTXs(Blockchair.networks.BITCOIN_CASH)(
                      address,
                      confirmations
                  ),
    ],

    broadcastTransaction: (testnet: boolean, hex: string) => [
        () =>
            JSONRPC.broadcastTransaction(
                testnet ? MULTICHAIN_URLS.BCHTEST : MULTICHAIN_URLS.BCH
            )(hex),
        () =>
            Insight.broadcastTransaction(
                testnet ? testnetInsight : mainnetInsight
            )(hex),
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
        const utxos = await fallback(endpoints);
        return utxos;
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
        const address = toCashAddr(options.address);
        const confirmations =
            options && options.confirmations !== undefined
                ? options.confirmations
                : 0;

        const endpoints = _apiFallbacks.fetchTXs(
            testnet,
            address,
            confirmations
        );
        return fallback(endpoints);
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
                        // bitcoin.Transaction.SIGHASH_ALL |
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

    private readonly _getConfirmations = async (
        txHash: string
    ): Promise<number> =>
        (
            await fallback(
                // Fetch confirmations for first output of transaction.
                _apiFallbacks.fetchUTXO(this.testnet, txHash, 0)
            )
        ).confirmations;

    private readonly _bitgoNetwork = () =>
        this.testnet
            ? bitcoin.networks.bitcoincashTestnet
            : bitcoin.networks.bitcoincash;
}
