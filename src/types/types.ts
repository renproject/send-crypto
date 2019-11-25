import BigNumber from "bignumber.js";
import BN from "bn.js";

import { PromiEvent } from "../promiEvent";

export type Asset = string | any;
export type Value = string | number | BigNumber | BN;

export interface Handler<Options = {}> {
    // Returns whether or not this can handle the asset
    readonly handlesAsset: (asset: Asset) => boolean;

    readonly address?: (
        asset: Asset,
        defer?: (asset: Asset) => Promise<string>
    ) => Promise<string>;

    // Balance
    readonly balanceOf?: (
        asset: Asset,
        address?: string,
        defer?: (asset: Asset, address?: string) => Promise<BigNumber>
    ) => Promise<BigNumber>;
    readonly balanceOfInSats?: (
        asset: Asset,
        address?: string,
        defer?: (asset: Asset, address?: string) => Promise<BigNumber>
    ) => Promise<BigNumber>;

    // Transfer
    readonly send?: (
        to: string | Buffer,
        value: BigNumber,
        asset: Asset,
        options?: Options,
        defer?: (
            to: string | Buffer,
            value: BigNumber,
            asset: Asset,
            options?: Options
        ) => PromiEvent<string>,
    ) => PromiEvent<string>;
    readonly sendSats?: (
        to: string | Buffer,
        value: BigNumber,
        asset: Asset,
        options?: Options,
        defer?: (
            to: string | Buffer,
            value: BigNumber,
            asset: Asset,
            options?: Options
        ) => PromiEvent<string>,
    ) => PromiEvent<string>;
}
