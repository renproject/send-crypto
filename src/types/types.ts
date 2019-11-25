import BigNumber from "bignumber.js";

import { PromiEvent } from "../promiEvent";

import BN = require("bn.js");

export type Asset = string | any;
export type Value = string | number | BigNumber | BN;

export interface Handler<Options = {}> {
    // Returns whether or not this can handle the asset
    readonly handlesAsset: (asset: Asset) => boolean;

    // Balance
    readonly balanceOf: (asset: Asset, defer?: (asset: Asset) => Promise<BigNumber>) => Promise<BigNumber>;
    readonly balanceOfInSats: (asset: Asset, defer?: (asset: Asset) => Promise<BigNumber>) => Promise<BigNumber>;

    // Transfer
    readonly send: (
        to: string | Buffer, value: Value, asset: Asset, options?: Options,
        defer?: (to: string | Buffer, value: Value, asset: Asset, options?: Options) => PromiEvent<string>,
    ) => PromiEvent<string>;
    readonly sendSats: (
        to: string | Buffer, value: Value, asset: Asset, options?: Options,
        defer?: (to: string | Buffer, value: Value, asset: Asset, options?: Options) => PromiEvent<string>,
    ) => PromiEvent<string>;
}
