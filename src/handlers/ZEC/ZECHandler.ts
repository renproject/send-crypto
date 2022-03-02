import BigNumber from "bignumber.js";
import * as bitcoin from "bitgo-utxo-lib";
import { List } from "immutable";

import { Insight } from "../../common/apis/insight";
import { JSONRPC, MULTICHAIN_URLS } from "../../common/apis/jsonrpc";
import { Sochain } from "../../common/apis/sochain";
import { BitgoUTXOLib } from "../../common/libraries/bitgoUtxoLib";
import { subscribeToConfirmations } from "../../lib/confirmations";
import { newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { fallback, retryNTimes } from "../../lib/retry";
import { shuffleArray } from "../../lib/utils";
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

enum InsightEndpoints {
    // Testnet
    TestnetZCash = "https://explorer.testnet.z.cash/api/",
    // Mainnet
    ZCash = "https://explorer.z.cash/api/",
    ZecBlockExplorer = "https://zecblockexplorer.com/api/",
    ZecChain = "https://zechain.net/api/v1/",
    BlockExplorer = "https://zcash.blockexplorer.com/api/",
}

export const _apiFallbacks = {
    fetchUTXO: (testnet: boolean, txHash: string, vOut: number) =>
        testnet
            ? [
                  ...shuffleArray(() =>
                      Insight.fetchUTXO(InsightEndpoints.TestnetZCash)(
                          txHash,
                          vOut
                      )
                  ),
                  () => Sochain.fetchUTXO("ZECTEST")(txHash, vOut),
              ]
            : [
                  ...shuffleArray(
                      () =>
                          Insight.fetchUTXO(InsightEndpoints.ZCash)(
                              txHash,
                              vOut
                          ),
                      () =>
                          Insight.fetchUTXO(InsightEndpoints.ZecBlockExplorer)(
                              txHash,
                              vOut
                          )
                  ),
                  () =>
                      Insight.fetchUTXO(InsightEndpoints.ZecChain)(
                          txHash,
                          vOut
                      ),
                  () =>
                      Insight.fetchUTXO(InsightEndpoints.BlockExplorer)(
                          txHash,
                          vOut
                      ),
              ],

    fetchUTXOs: (testnet: boolean, address: string, confirmations: number) =>
        testnet
            ? [
                  ...shuffleArray(() =>
                      Insight.fetchUTXOs(InsightEndpoints.TestnetZCash)(
                          address,
                          confirmations
                      )
                  ),
                  () => Sochain.fetchUTXOs("ZECTEST")(address, confirmations),
              ]
            : [
                  ...shuffleArray(
                      () =>
                          Insight.fetchUTXOs(InsightEndpoints.ZCash)(
                              address,
                              confirmations
                          ),

                      () =>
                          Insight.fetchUTXOs(InsightEndpoints.ZecBlockExplorer)(
                              address,
                              confirmations
                          )
                  ),
                  () => Sochain.fetchUTXOs("ZEC")(address, confirmations),
                  () =>
                      Insight.fetchUTXOs(InsightEndpoints.ZecChain)(
                          address,
                          confirmations
                      ),
                  () =>
                      Insight.fetchUTXOs(InsightEndpoints.BlockExplorer)(
                          address,
                          confirmations
                      ),
              ],

    fetchTXs: (testnet: boolean, address: string, confirmations: number = 0) =>
        testnet
            ? [
                  ...shuffleArray(() =>
                      Insight.fetchTXs(InsightEndpoints.TestnetZCash)(
                          address,
                          confirmations
                      )
                  ),
                  () => Sochain.fetchTXs("ZECTEST")(address, confirmations),
              ]
            : [
                  ...shuffleArray(
                      () =>
                          Insight.fetchTXs(InsightEndpoints.ZCash)(
                              address,
                              confirmations
                          ),

                      () =>
                          Insight.fetchTXs(InsightEndpoints.ZecBlockExplorer)(
                              address,
                              confirmations
                          )
                  ),
                  () => Sochain.fetchTXs("ZEC")(address, confirmations),
                  () =>
                      Insight.fetchTXs(InsightEndpoints.ZecChain)(
                          address,
                          confirmations
                      ),
                  () =>
                      Insight.fetchTXs(InsightEndpoints.BlockExplorer)(
                          address,
                          confirmations
                      ),
              ],

    broadcastTransaction: (testnet: boolean, hex: string) =>
        testnet
            ? [
                  () =>
                      JSONRPC.broadcastTransaction(MULTICHAIN_URLS.ZECTEST)(
                          hex
                      ),
                  () =>
                      Insight.broadcastTransaction(
                          InsightEndpoints.TestnetZCash
                      )(hex),
                  () => Sochain.broadcastTransaction("ZECTEST")(hex),
              ]
            : [
                  ...shuffleArray(
                      () =>
                          Insight.broadcastTransaction(InsightEndpoints.ZCash)(
                              hex
                          ),
                      () =>
                          Insight.broadcastTransaction(
                              InsightEndpoints.ZecBlockExplorer
                          )(hex),
                      () => Sochain.broadcastTransaction("ZEC")(hex)
                  ),
                  () =>
                      Insight.broadcastTransaction(InsightEndpoints.ZecChain)(
                          hex
                      ),
                  () =>
                      Insight.broadcastTransaction(
                          InsightEndpoints.BlockExplorer
                      )(hex),
                  () => JSONRPC.broadcastTransaction(MULTICHAIN_URLS.ZEC)(hex),
              ],
};

export class ZECHandler implements Handler {
    private readonly privateKey: { getAddress: () => string };
    private readonly testnet: boolean;

    private readonly decimals = 8;

    static getUTXOs = async (
        testnet: boolean,
        options: { address: string; confirmations?: number }
    ): Promise<readonly UTXO[]> => {
        const confirmations =
            options && options.confirmations !== undefined
                ? options.confirmations
                : 0;
        return fallback(
            _apiFallbacks.fetchUTXOs(testnet, options.address, confirmations)
        );
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

    constructor(privateKey: string, network: string) {
        this.testnet = network !== "mainnet";
        this.privateKey = BitgoUTXOLib.loadPrivateKey(
            this.testnet ? bitcoin.networks.zcashTest : bitcoin.networks.zcash,
            privateKey
        );
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        typeof asset === "string" &&
        ["ZEC", "ZCASH"].indexOf(asset.toUpperCase()) !== -1;

    public readonly address = async (
        asset: Asset,
        options?: AddressOptions
    ): Promise<string> => this.privateKey.getAddress();

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
        const utxos = await ZECHandler.getUTXOs(this.testnet, {
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
            const fromAddress = await this.address(asset);
            const changeAddress = fromAddress;
            const utxos = List(
                await ZECHandler.getUTXOs(this.testnet, {
                    ...options,
                    address: fromAddress,
                })
            )
                .sortBy((utxo) => utxo.amount)
                .reverse()
                .toArray();

            if (this.testnet) {
                // tslint:disable-next-line: no-object-mutation
                bitcoin.networks.zcashTest.consensusBranchId["4"] = 37519621;
            }

            const built = await BitgoUTXOLib.buildUTXO(
                this.testnet
                    ? bitcoin.networks.zcashTest
                    : bitcoin.networks.zcash,
                this.privateKey,
                changeAddress,
                to,
                valueIn,
                utxos,
                {
                    ...options,
                    version: 4,
                    versionGroupID: 0x892f2085,
                    consensusBranchId: 0x37519621,
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
}
