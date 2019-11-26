import * as bitcoin from "bitgo-utxo-lib";

import axios from "axios";
import BigNumber from "bignumber.js";

import { fetchFromChainSo, getUTXOs, UTXO } from "../lib/mercury";
import { newPromiEvent, PromiEvent } from "../lib/promiEvent";
import { retryNTimes, sleep } from "../lib/retry";
import { Asset, Handler } from "../types/types";

interface AddressOptions { }
interface BalanceOptions extends AddressOptions {
    address?: string;
    confirmations?: number; // defaults to 0
}
interface TxOptions extends BalanceOptions {
    fee?: number;           // defaults to 10000
}

interface BlockstreamUTXO<vout = number> {
    readonly status: {
        readonly confirmed: false,
    } | {
        readonly confirmed: true,
        readonly block_height: number,
        readonly block_hash: string,
        readonly block_time: number,
    };
    readonly txid: string;
    readonly value: number;
    readonly vout: vout;
};

interface BlockstreamDetailsUTXO extends BlockstreamUTXO<Array<{
    scriptpubkey: string,
    scriptpubkey_asm: string,
    scriptpubkey_type: string,
    scriptpubkey_address: string,
    value: number,
}>> {
    locktime: number;
    vin: Array<{
        txid: string,
        vout: number,
        prevout: any,
        scriptsig: string,
        scriptsig_asm: string,
        is_coinbase: false,
        sequence: number,
    }>,
    size: number,
    weight: number,
    fee: number,
}

export const fetchConfirmationsFromBlockstream = async (txid: string, testnet: boolean): Promise<number> => {
    const apiUrl = `https://blockstream.info/${testnet ? "testnet/" : ""}api`;

    const response = await retryNTimes(
        () => axios.get<BlockstreamDetailsUTXO>(`${apiUrl}/tx/${txid}`),
        5,
    );

    const heightResponse = () => retryNTimes(
        () => axios.get<string>(`${apiUrl}/blocks/tip/height`),
        5,
    );

    const utxo = response.data;
    return utxo.status.confirmed ? 1 + parseInt((await heightResponse()).data, 10) - utxo.status.block_height : 0;
};
export const fetchFromBlockstream = async (address: string, testnet: boolean): Promise<readonly UTXO[]> => {
    const apiUrl = `https://blockstream.info/${testnet ? "testnet/" : ""}api`;

    const response = await retryNTimes(
        () => axios.get<ReadonlyArray<{
            readonly status: {
                readonly confirmed: boolean,
                readonly block_height: number,
                readonly block_hash: string,
                readonly block_time: number,
            };
            readonly txid: string;
            readonly value: number;
            readonly vout: number;
        }>>(`${apiUrl}/address/${address}/utxo`),
        5,
    );

    const heightResponse = await retryNTimes(
        () => axios.get<string>(`${apiUrl}/blocks/tip/height`),
        5,
    );

    // tslint:disable-next-line: no-object-literal-type-assertion
    return response.data.map(utxo => ({
        txid: utxo.txid,
        value: utxo.value,
        // Placeholder
        script_hex: "76a914b0c08e3b7da084d7dbe9431e9e49fb61fb3b64d788ac",
        output_no: utxo.vout,
        confirmations: utxo.status.confirmed ? 1 + parseInt(heightResponse.data, 10) - utxo.status.block_height : 0,
    }));
};

export class BTCHandler implements Handler {
    private readonly privateKey: { getAddress: () => string; };
    private readonly testnet: boolean;

    private readonly decimals = 8;

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
            new BigNumber(10).exponentiatedBy(this.decimals)
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
            value.times(new BigNumber(10).exponentiatedBy(this.decimals)),
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

        let txHash: string;
        let errored: boolean;

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

            txHash = await this._sendRawTransaction(built.toHex());

            promiEvent.emit('transactionHash', txHash);
            promiEvent.resolve(txHash);
        })().catch((error) => { errored = true; promiEvent.reject(error) });

        let mutex;
        const watchForConfirmations = async () => {
            const lock = Symbol();
            mutex = lock;
            while (!txHash) {
                if (errored || watchingConfirmations === 0 || mutex !== lock) {
                    return;
                }
                await sleep(100);
            }
            // Yield to task manager
            await sleep(0);

            let confirmations = 0;
            while (watchingConfirmations && mutex === lock) {
                const newConfirmations = await fetchConfirmationsFromBlockstream(txHash, this.testnet);
                if (newConfirmations > confirmations) {
                    confirmations = newConfirmations;
                    promiEvent.emit("confirmation", confirmations);
                }
            }
        };

        let watchingConfirmations = 0;
        promiEvent.on("newListener", eventName => {
            if (eventName === "confirmation") {
                watchingConfirmations++;
                if (watchingConfirmations === 1) {
                    watchForConfirmations();
                }
            }
        });

        promiEvent.on("removeListener", eventName => {
            if (eventName === "confirmation") {
                watchingConfirmations--;
            }
        });

        return promiEvent;
    };

    // tslint:disable-next-line: readonly-keyword
    private readonly _getUTXOs = async (asset: Asset, options?: { address?: string, confirmations?: number }): Promise<readonly UTXO[]> => {
        const address = options && options.address || await this.address(asset);
        const confirmations = options && options.confirmations !== undefined ? options.confirmations : 0;

        const endpoints = [
            () => fetchFromBlockstream(address, this.testnet),
            () => fetchFromChainSo(`https://sochain.com/api/v2/get_tx_unspent/${this.testnet ? "BTCTEST" : "BTC"}/${address}/${confirmations}`),
        ];
        return getUTXOs(this.testnet, "BTC", endpoints)(address, confirmations);
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
