import BigNumber from "bignumber.js";

import { PromiEvent } from "../lib/promiEvent";

export type Asset = string | object;
export type Value = string | number | BigNumber | { toString: () => string };

export interface DeferHandler<Options = {}> {
    readonly address: (
        asset: Asset,
        options?: any & {}
    ) => Promise<string> | string;

    // Balance
    readonly getBalance: (
        asset: Asset,
        options?: any & { readonly address?: string }
    ) => Promise<BigNumber>;
    readonly getBalanceInSats: (
        asset: Asset,
        options?: any & { readonly address?: string }
    ) => Promise<BigNumber>;

    // Transfer
    readonly send: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: Options
    ) => PromiEvent<string>;
    readonly sendSats: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: Options
    ) => PromiEvent<string>;
}

// tslint:disable: member-ordering
export abstract class Handler<
    ConstructorOptions = {},
    AddressOptions = {},
    BalanceOptions extends { address?: string } = { address?: string },
    TxOptions = {}
> {
    constructor(
        _privateKey: string,
        _network: string,
        _constructorOptions?: ConstructorOptions,
        _sharedState?: any
    ) {} // tslint:disable-line: no-empty

    // Returns whether or not this can handle the asset
    public handlesAsset!: (asset: Asset) => boolean;

    // Returns the address of the account
    public address?: (
        asset: Asset,
        options: AddressOptions,
        deferHandler: DeferHandler
    ) => Promise<string> | string;

    // Returns the balance of the account
    public getBalance?: (
        asset: Asset,
        options: BalanceOptions,
        deferHandler: DeferHandler
    ) => Promise<BigNumber>;
    public getBalanceInSats?: (
        asset: Asset,
        options: BalanceOptions,
        deferHandler: DeferHandler
    ) => Promise<BigNumber>;

    // Transfers the asset to the provided address
    public send?: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options: TxOptions,
        deferHandler: DeferHandler
    ) => PromiEvent<string>;
    public sendSats?: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options: TxOptions,
        deferHandler: DeferHandler
    ) => PromiEvent<string>;
}

export type HandlerClass = new <Options extends {}>(
    privateKey: string,
    network: string,
    constructorOptions?: Options,
    sharedState?: any
) => Handler;
