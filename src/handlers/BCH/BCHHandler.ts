import * as bitcoin from "bitgo-utxo-lib";

import { toCashAddress, toLegacyAddress } from "bchaddrjs";
import BigNumber from "bignumber.js";
import { List } from "immutable";

import { BitcoinDotCom } from "../../common/apis/bitcoinDotCom";
import { Sochain } from "../../common/apis/sochain";
import { BitgoUTXOLib } from "../../common/libraries/bitgoUtxoLib";
import { subscribeToConfirmations } from "../../lib/confirmations";
import { UTXO } from "../../lib/mercury";
import { newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { fallback, retryNTimes } from "../../lib/retry";
import { shuffleArray } from "../../lib/utils";
import { Asset, Handler } from "../../types/types";

interface AddressOptions { }
interface BalanceOptions extends AddressOptions {
    address?: string;
    confirmations?: number; // defaults to 0
}
interface TxOptions extends BalanceOptions {
    fee?: number;           // defaults to 10000
    subtractFee?: boolean;  // defaults to false
}

export class BCHHandler implements Handler {
    private readonly privateKey: { getAddress: () => string; };
    private readonly testnet: boolean;

    private readonly decimals = 8;

    constructor(privateKey: string, network: string) {
        this.testnet = network !== "mainnet";
        this.privateKey = BitgoUTXOLib.loadPrivateKey(this._bitgoNetwork(), privateKey);
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        typeof asset === "string" && ["BCH", "BITCOIN CASH", "BCASH", "BITCOINCASH", "BITCOIN-CASH"].indexOf(asset.toUpperCase()) !== -1;

    public readonly address = async (asset: Asset, options?: AddressOptions): Promise<string> =>
        toCashAddress(this.privateKey.getAddress());

    // Balance
    public readonly getBalance = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> =>
        (await this.getBalanceInSats(asset, options)).dividedBy(
            new BigNumber(10).exponentiatedBy(this.decimals)
        );

    public readonly getBalanceInSats = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> => {
        const utxos = await getUTXOs(this.testnet, { ...options, address: options && options.address || await this.address(asset) });
        return utxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));
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
            const utxos = List(await getUTXOs(this.testnet, { ...options, address: fromAddress })).sortBy(utxo => utxo.value).reverse().toArray();

            const built = await BitgoUTXOLib.buildUTXO(
                this._bitgoNetwork(),
                // tslint:disable-next-line: no-bitwise
                this.privateKey, changeAddress, toAddress, valueIn, utxos, { ...options, signFlag: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143 },
            );

            txHash = await retryNTimes(() => fallback(shuffleArray([
                () => BitcoinDotCom.broadcastTransaction(this.testnet)(built.toHex()),
            ])), 5);

            promiEvent.emit('transactionHash', txHash);
            promiEvent.resolve(txHash);
        })().catch((error) => { errored = true; promiEvent.reject(error) });

        subscribeToConfirmations(
            promiEvent,
            () => errored,
            async () => txHash ? this._getConfirmations(txHash) : 0,
        )

        return promiEvent;
    };

    private readonly _getConfirmations = (txHash: string) => retryNTimes(() => fallback([
        () => BitcoinDotCom.fetchConfirmations(this.testnet)(txHash),
    ]), 5);
    private readonly _bitgoNetwork = () => this.testnet ? bitcoin.networks.bitcoincashTestnet : bitcoin.networks.bitcoincash;
}

export const getUTXOs = async (testnet: boolean, options: { address: string, confirmations?: number }): Promise<readonly UTXO[]> => {
    const address = toCashAddress(options.address);
    const confirmations = options.confirmations || 0;

    const endpoints = shuffleArray([
        () => BitcoinDotCom.fetchUTXOs(testnet)(address, confirmations),
        () => Sochain.fetchUTXOs(testnet ? "BTCTEST" : "BTC")(address, confirmations),
    ]);
    return retryNTimes(() => fallback(endpoints), 5);
};
