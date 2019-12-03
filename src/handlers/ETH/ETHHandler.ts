// import HDWalletProvider from "@truffle/hdwallet-provider";
import BigNumber from "bignumber.js";
import Web3 from "web3";
import { TransactionConfig } from "web3-core";

import { forwardEvents, newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { Asset, Handler } from "../../types/types";
import { getEndpoint, getNetwork, getTransactionConfig, getWeb3 } from "./ethUtils";

interface ConstructorOptions {
    infuraKey?: string;
    ethereumNode?: string;
}
interface AddressOptions { }
interface BalanceOptions extends AddressOptions {
    address?: string;

    // Note that this acts differently to BTC/BCH/ZEC. This returns the balance
    // (confirmations - 1) blocks ago.
    confirmations?: number; // defaults to 0
}
interface TxOptions extends TransactionConfig {
    subtractFee?: boolean;  // defaults to false
}

export class ETHHandler implements Handler<ConstructorOptions, AddressOptions, BalanceOptions, TxOptions> {
    private readonly privateKey: string;
    private readonly network: string;

    private readonly decimals = 18;

    private readonly unlockedAddress: string;

    private readonly sharedState: {
        web3: Web3;
    };

    constructor(privateKey: string, network: string, options?: ConstructorOptions, sharedState?: any) {
        this.network = getNetwork(network);
        this.privateKey = privateKey;
        const [web3, address] = getWeb3(this.privateKey, getEndpoint(this.network, options && options.ethereumNode, options && options.infuraKey));
        this.unlockedAddress = address;
        sharedState.web3 = web3;
        this.sharedState = sharedState;
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        typeof asset === "string" && ["ETH", "ETHER", "ETHEREUM"].indexOf(asset.toUpperCase()) !== -1;

    public readonly address = async (asset: Asset, options?: AddressOptions): Promise<string> =>
        this.unlockedAddress;
    // (await this.sharedState.web3.eth.getAccounts())[0];

    // Balance
    public readonly getBalance = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> =>
        (await this.getBalanceInSats(asset, options)).dividedBy(
            new BigNumber(10).exponentiatedBy(this.decimals)
        );

    public readonly getBalanceInSats = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> => {
        let atBlock;
        if (options && options.confirmations && options.confirmations > 0) {
            const currentBlock = new BigNumber(await this.sharedState.web3.eth.getBlockNumber());
            atBlock = currentBlock.minus(options.confirmations).plus(1).toNumber();
        }
        const address = options && options.address || await this.address(asset);
        return new BigNumber(await this.sharedState.web3.eth.getBalance(address, atBlock as any));
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
        optionsIn?: TxOptions
    ): PromiEvent<string> => {

        const promiEvent = newPromiEvent<string>();

        (async () => {
            const options = optionsIn || {};

            let value = valueIn;

            const txOptions = getTransactionConfig(options);

            if (options.subtractFee) {
                const gasPrice = txOptions.gasPrice || await this.sharedState.web3.eth.getGasPrice();
                const gasLimit = txOptions.gas || 21000;
                const fee = new BigNumber(gasPrice.toString()).times(gasLimit);
                value = value.minus(fee);
            }
            const web3PromiEvent = this.sharedState.web3.eth.sendTransaction({
                from: await this.address(asset),
                gas: 21000,
                ...txOptions,
                to,
                value: value.toFixed(),
            }) as unknown as PromiEvent<string>;
            forwardEvents(web3PromiEvent, promiEvent);
            web3PromiEvent.then(promiEvent.resolve);
        })().catch((error) => { promiEvent.reject(error) });

        return promiEvent;
    };
}
