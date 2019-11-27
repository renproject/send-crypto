import * as bitcoin from "bitgo-utxo-lib";

import BigNumber from "bignumber.js";
import { List } from "immutable";

import { Blockstream } from "../apis/blockstream";
import { Sochain } from "../apis/sochain";
import { subscribeToConfirmations } from "../lib/confirmations";
import { UTXO } from "../lib/mercury";
import { newPromiEvent, PromiEvent } from "../lib/promiEvent";
import { fallback, sleep } from "../lib/retry";
import { Asset, Handler } from "../types/types";

interface AddressOptions { }
interface BalanceOptions extends AddressOptions {
    address?: string;
    confirmations?: number; // defaults to 0
}
interface TxOptions extends BalanceOptions {
    fee?: number;           // defaults to 10000
    subtractFee?: boolean;  // defaults to false
}

export class BTCHandler implements Handler {
    private readonly privateKey: { getAddress: () => string; };
    private readonly testnet: boolean;

    private readonly decimals = 8;

    constructor(privateKey: string, network: string) {
        this.testnet = network !== "mainnet";
        this.privateKey = bitcoin.ECPair.fromPrivateKeyBuffer(Buffer.from(privateKey, "hex"), this.testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        asset.toUpperCase() === 'BTC' || asset.toUpperCase() === "BITCOIN";

    public readonly address = async (asset: Asset, options?: AddressOptions): Promise<string> =>
        this.privateKey.getAddress();

    // Balance
    // tslint:disable-next-line: readonly-keyword
    public readonly balanceOf = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> =>
        (await this.balanceOfInSats(asset, options)).dividedBy(
            new BigNumber(10).exponentiatedBy(this.decimals)
        );

    // tslint:disable-next-line: readonly-keyword
    public readonly balanceOfInSats = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> => {
        const utxos = await this._getUTXOs(asset, options);
        return utxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));
    };

    // Transfer
    public readonly send = (
        to: string | Buffer,
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
        to: string | Buffer,
        valueIn: BigNumber,
        asset: Asset,
        options?: TxOptions
    ): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>();

        let txHash: string;
        let errored: boolean;

        (async () => {
            const utxos = List(await this._getUTXOs(asset, { ...options, address: await this.address(asset) })).sortBy(utxo => utxo.value).reverse().toArray();

            const fees = new BigNumber(options && options.fee !== undefined ? options.fee : 10000);

            const value = options && options.subtractFee ? valueIn.minus(fees) : valueIn;

            const tx = new bitcoin.TransactionBuilder(this.testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);

            // Only use the required utxos
            const [usedUTXOs, sum] = utxos.reduce(([utxoAcc, total], utxo) => total.lt(value.plus(fees)) ? [[...utxoAcc, utxo], total.plus(utxo.value)] : [utxoAcc, total], [[] as UTXO[], new BigNumber(0)])

            if (sum.lt(value.plus(fees))) {
                throw new Error("Insufficient balance to broadcast transaction");
            }

            // Add all inputs
            usedUTXOs.map(utxo => {
                tx.addInput(utxo.txid, utxo.output_no);
            });

            const change = sum.minus(value).minus(fees);

            // Add outputs
            tx.addOutput(to, value.toNumber());
            if (change.gt(0)) { tx.addOutput(await this.address(asset), change.toNumber()); }

            // Sign inputs
            usedUTXOs.map((utxo, i) => {
                tx.sign(i, this.privateKey, "", null, utxo.value);
            });

            const built = tx.build();

            txHash = await fallback([
                () => Blockstream.broadcastTransaction(built.toHex(), this.testnet),
                () => Sochain.broadcastTransaction(built.toHex(), this.testnet),
            ]);

            promiEvent.emit('transactionHash', txHash);
            promiEvent.resolve(txHash);
        })().catch((error) => { errored = true; promiEvent.reject(error) });

        subscribeToConfirmations(
            promiEvent,
            () => errored,
            async () => txHash ? Blockstream.fetchConfirmations(txHash, this.testnet) : 0,
        )

        return promiEvent;
    };

    // tslint:disable-next-line: readonly-keyword
    private readonly _getUTXOs = async (asset: Asset, options?: { address?: string, confirmations?: number }): Promise<readonly UTXO[]> => {
        const address = options && options.address || await this.address(asset);
        const confirmations = options && options.confirmations !== undefined ? options.confirmations : 0;

        const endpoints = [
            () => Blockstream.fetchUTXOs(address, confirmations, this.testnet),
            () => Sochain.fetchUTXOs(`https://sochain.com/api/v2/get_tx_unspent/${this.testnet ? "BTCTEST" : "BTC"}/${address}/${confirmations}`),
        ];
        return fallback(endpoints);
    };
}
