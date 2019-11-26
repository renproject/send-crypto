import * as bitcoin from "bitgo-utxo-lib";

import axios from "axios";
import BigNumber from "bignumber.js";

import { getUTXOs, UTXO } from "../lib/mercury";
import { newPromiEvent, PromiEvent } from "../lib/promiEvent";
import { Asset, Handler } from "../types/types";

interface AddressOptions { }
interface BalanceOptions extends AddressOptions {
    address?: string;
    confirmations?: number; // defaults to 0
}
interface TxOptions extends BalanceOptions {
    fee?: number;           // defaults to 10000
}

export class BTCHandler implements Handler {
    private readonly privateKey: { getAddress: () => string; };
    private readonly testnet: boolean;

    constructor(privateKey: string, network: string) {
        this.testnet = network !== "mainnet";
        this.privateKey = bitcoin.ECPair.fromPrivateKeyBuffer(Buffer.from(privateKey, "hex"), this.testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean => {
        return asset === 'BTC';
    };

    public readonly address = async (asset: Asset, options?: AddressOptions): Promise<string> => {
        return this.privateKey.getAddress();
    }

    // Balance
    // tslint:disable-next-line: readonly-keyword
    public readonly balanceOf = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> => {
        return (await this.balanceOfInSats(asset, options)).dividedBy(
            new BigNumber(10).exponentiatedBy(8)
        );
    };

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
    ): PromiEvent<string> => {
        return this.sendSats(
            to,
            value.times(new BigNumber(10).exponentiatedBy(8)),
            asset,
            options
        );
    };

    public readonly sendSats = (
        to: string | Buffer,
        value: BigNumber,
        asset: Asset,
        options?: TxOptions
    ): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>();

        (async () => {
            const utxos = await this._getUTXOs(asset, { ...options, address: await this.address(asset) });

            const fees = new BigNumber(options && options.fee !== undefined ? options.fee : 10000);

            const tx = new bitcoin.TransactionBuilder(this.testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin);

            // Add up balance
            const availableSatoshis = utxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));

            if (availableSatoshis.lt(value.plus(fees))) {
                throw new Error("Insufficient balance to broadcast transaction");
            }

            const change = availableSatoshis.minus(value).minus(fees);

            // Add all inputs
            utxos.map(utxo => {
                tx.addInput(utxo.txid, utxo.output_no);
            });

            // Add outputs
            tx.addOutput(to, value.toNumber());
            if (change.gt(0)) { tx.addOutput(await this.address(asset), change.toNumber()); }

            // Sign inputs
            utxos.map((utxo, i) => {
                // tslint:disable-next-line: no-bitwise
                tx.sign(i, this.privateKey, "", bitcoin.Transaction.SIGHASH_SINGLE, utxo.value);
            });

            const built = tx.build();

            const txHash = await this._sendRawTransaction(built.toHex());

            promiEvent.emit('transactionHash', txHash);
            promiEvent.resolve(txHash);
        })().catch(promiEvent.reject);

        // promiEvent.emit('confirmations', 1);
        return promiEvent;
    };

    // tslint:disable-next-line: readonly-keyword
    private readonly _getUTXOs = async (asset: Asset, options?: { address?: string, confirmations?: number }): Promise<readonly UTXO[]> => {
        return getUTXOs(this.testnet, "BTC")(options && options.address || await this.address(asset), options && options.confirmations !== undefined ? options.confirmations : 0);
    };

    private readonly _sendRawTransaction = async (txHex: string): Promise<string> => {
        try {
            const response = await axios.post<string>("https://blockstream.info/testnet/api/tx", txHex);
            return response.data;
        } catch (error) {
            try {
                const response = await axios.post<{
                    readonly status: "success";
                    readonly data: {
                        readonly network: string;
                        readonly txid: string; // Hex without 0x
                    }
                }>(`https://chain.so/send_tx/${this.testnet ? "BTCTEST" : "BTC"}`, { tx_hex: txHex });
                return response.data.data.txid;
            } catch (chainSoError) {
                throw error;
            }
        }
    };
}
