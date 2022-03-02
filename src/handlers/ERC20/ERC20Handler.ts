import BigNumber from "bignumber.js";
import { ethers, Overrides } from "ethers";

import { newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { Asset, DeferHandler, Handler } from "../../types/types";
import { getNetwork, getTransactionConfig } from "../ETH/ethUtils";
import { ERC20ABI } from "./ERC20ABI";
import { ERC20s } from "./ERC20s";

interface ConstructorOptions {}
interface AddressOptions {}
interface BalanceOptions extends AddressOptions {
    address?: string;
}
interface TxOptions extends Overrides {
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
        Handler<ConstructorOptions, AddressOptions, BalanceOptions, TxOptions>
{
    private readonly network: string;
    private readonly sharedState: {
        ethSigner: ethers.Signer;
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
            (await this.getContract(asset).balanceOf(address)).toString()
        );
    };

    // Transfer
    // This is re-implemented instead of calling sendSats so that a PromiEvent
    // can be returned.
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
            const value = valueIn.times(
                new BigNumber(10).exponentiatedBy(await this.decimals(asset))
            );

            const contract = this.getContract(asset);

            const config = {
                from: await deferHandler.address("ETH"),
                ...getTransactionConfig(options),
            };

            let tx: ethers.providers.TransactionResponse;
            // tslint:disable: prefer-conditional-expression
            if (options.approve) {
                // config.gasLimit = contract.estimateGas.approve(to, valueIn.toFixed());
                tx = await contract.approve(to, value.toFixed(), config);
            } else {
                // config.gasLimit = contract.estimateGas.transfer(to, valueIn.toFixed());
                tx = await contract.transfer(to, value.toFixed(), config);
            }

            promiEvent.emit("transactionHash", tx.hash);
            await tx.wait();
            promiEvent.resolve(tx.hash);
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

            const config = {
                from: await deferHandler.address("ETH"),
                ...getTransactionConfig(options),
            };

            // tslint:disable: prefer-conditional-expression
            let tx: ethers.providers.TransactionResponse;
            if (options.approve) {
                // config.gasLimit = contract.estimateGas.approve(to, valueIn.toFixed());
                tx = await contract.approve(to, valueIn.toFixed(), config);
            } else {
                // config.gasLimit = contract.estimateGas.transfer(to, valueIn.toFixed());
                tx = await contract.transfer(to, valueIn.toFixed(), config);
            }

            promiEvent.emit("transactionHash", tx.hash);
            await tx.wait();
            promiEvent.resolve(tx.hash);
        })().catch((error) => {
            promiEvent.reject(error);
        });

        return promiEvent;
    };

    private readonly getContract = (asset: Asset) => {
        return new ethers.Contract(
            resolveAsset(this.network, asset).address,
            ERC20ABI,
            this.sharedState.ethSigner
        );
    };

    private readonly decimals = async (asset: Asset): Promise<number> => {
        const address = resolveAsset(this.network, asset).address;
        if (this._decimals[address]) {
            return this._decimals[address];
        }
        return new BigNumber(
            (await this.getContract(asset).decimals()).toString()
        ).toNumber();
    };
}
