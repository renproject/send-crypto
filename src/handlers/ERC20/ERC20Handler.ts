import BigNumber from "bignumber.js";
import Web3 from "web3";
import { TransactionConfig } from "web3-core";

import { forwardEvents, newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { Asset, DeferHandler, Handler } from "../../types/types";
import { getNetwork, getTransactionConfig } from "../ETH/ethUtils";
import { ERC20ABI } from "./ERC20ABI";
import { ERC20s } from "./ERC20s";

interface ConstructorOptions {}
interface AddressOptions {}
interface BalanceOptions extends AddressOptions {
    address?: string;
}
interface TxOptions extends TransactionConfig {
    approve?: boolean;
}

const resolveAsset = (network: string, assetIn: Asset): { address: string } => {
    if (typeof assetIn !== "object") {
        throw new Error("");
    }
    const asset = assetIn as { address?: string; name?: string };
    if (asset.address) {
        return { ...asset, address: asset.address };
    } else {
        const address = ((ERC20s as any)[network] || {})[asset.name || ""];
        if (!address) {
            throw new Error(
                `Unknown ERC20 token ${asset.name || JSON.stringify(asset)}`
            );
        }
        return { ...asset, address };
    }
};

export class ERC20Handler
    implements
        Handler<ConstructorOptions, AddressOptions, BalanceOptions, TxOptions> {
    private readonly network: string;
    private readonly sharedState: {
        web3: Web3;
    };
    private _decimals: { [address: string]: number } = {};

    constructor(
        _privateKey: string,
        network: string,
        _options?: ConstructorOptions,
        sharedState?: any
    ) {
        this.network = getNetwork(network);
        this.sharedState = sharedState;
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean => {
        return (
            typeof asset === "object" &&
            asset.hasOwnProperty("type") &&
            (asset as { type: string }).type === "ERC20" &&
            (asset.hasOwnProperty("address") || asset.hasOwnProperty("name"))
        );
    };

    // Address
    public readonly address = async (
        asset: Asset,
        options: AddressOptions,
        deferHandler: DeferHandler
    ): Promise<string> => deferHandler.address("ETH", options);

    // Balance
    public readonly getBalance = async (
        assetIn: Asset,
        options: BalanceOptions,
        deferHandler: DeferHandler
    ): Promise<BigNumber> => {
        const asset = resolveAsset(this.network, assetIn);
        const decimals = await this.decimals(asset);
        return (
            await this.getBalanceInSats(asset, options, deferHandler)
        ).dividedBy(new BigNumber(10).exponentiatedBy(decimals));
    };

    public readonly getBalanceInSats = async (
        assetIn: Asset,
        options: BalanceOptions,
        deferHandler: DeferHandler
    ): Promise<BigNumber> => {
        const asset = resolveAsset(this.network, assetIn);
        const address =
            (options && options.address) ||
            (deferHandler && (await deferHandler.address("ETH", options))) ||
            "";
        return new BigNumber(
            await this.getContract(asset).methods.balanceOf(address).call()
        );
    };

    // Transfer
    public readonly send = (
        to: string,
        valueIn: BigNumber,
        assetIn: Asset,
        options: TxOptions,
        deferHandler: DeferHandler
    ): PromiEvent<string> => {
        const asset = resolveAsset(this.network, assetIn);
        const promiEvent = newPromiEvent<string>();

        (async () => {
            const contract = this.getContract(asset);
            const method = options.approve
                ? contract.methods.approve
                : contract.methods.transfer;
            const call = method(
                to,
                valueIn
                    .times(
                        new BigNumber(10).exponentiatedBy(
                            await this.decimals(asset)
                        )
                    )
                    .toFixed()
            );
            const config = {
                from: await deferHandler.address("ETH"),
                ...getTransactionConfig(options),
            };
            // tslint:disable-next-line: no-object-mutation
            config.gas = await call.estimateGas(config);
            const web3PromiEvent = (call.send(config) as unknown) as PromiEvent<
                string
            >;

            forwardEvents(web3PromiEvent, promiEvent);
            web3PromiEvent.then(promiEvent.resolve);
        })().catch((error) => {
            promiEvent.reject(error);
        });

        return promiEvent;
    };

    public readonly sendSats = (
        to: string,
        valueIn: BigNumber,
        assetIn: Asset,
        options: TxOptions,
        deferHandler: DeferHandler
    ): PromiEvent<string> => {
        const asset = resolveAsset(this.network, assetIn);
        const promiEvent = newPromiEvent<string>();

        (async () => {
            const contract = this.getContract(asset);
            const method = options.approve
                ? contract.methods.approve
                : contract.methods.transfer;
            const call = method(to, valueIn.toFixed());
            const config = {
                from: await deferHandler.address("ETH"),
                ...getTransactionConfig(options),
            };
            // tslint:disable-next-line: no-object-mutation
            config.gas = await call.estimateGas(config);
            const web3PromiEvent = (call.send(config) as unknown) as PromiEvent<
                string
            >;

            forwardEvents(web3PromiEvent, promiEvent);
            web3PromiEvent.then(promiEvent.resolve);
        })().catch((error) => {
            promiEvent.reject(error);
        });

        return promiEvent;
    };

    private readonly getContract = (asset: Asset) => {
        return new this.sharedState.web3.eth.Contract(
            ERC20ABI,
            resolveAsset(this.network, asset).address
        );
    };

    private readonly decimals = async (asset: Asset) => {
        const address = resolveAsset(this.network, asset).address;
        if (this._decimals[address]) {
            return this._decimals[address];
        }
        return this.getContract(asset).methods.decimals().call();
    };
}
