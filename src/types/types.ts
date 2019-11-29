import BigNumber from "bignumber.js";
import BN from "bn.js";

import { PromiEvent } from "../lib/promiEvent";

export type Asset = string | any;
export type Value = string | number | BigNumber | BN;

export interface Handler<Options = {}> {
    // Returns whether or not this can handle the asset
    readonly handlesAsset: (asset: Asset) => boolean;

    readonly address?: (
        asset: Asset,
        options?: any & {},
        defer?: (asset: Asset, options?: any & {}) => Promise<string>
    ) => Promise<string>;

    // Balance
    readonly balanceOf?: (
        asset: Asset,
        options?: any & { readonly address?: string },
        defer?: (asset: Asset, address?: string) => Promise<BigNumber>
    ) => Promise<BigNumber>;
    readonly balanceOfInSats?: (
        asset: Asset,
        options?: any & { readonly address?: string },
        defer?: (asset: Asset, address?: string) => Promise<BigNumber>
    ) => Promise<BigNumber>;

    // Transfer
    readonly send?: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: Options,
        defer?: (
            to: string,
            value: BigNumber,
            asset: Asset,
            options?: Options
        ) => PromiEvent<string>,
    ) => PromiEvent<string>;
    readonly sendSats?: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: Options,
        defer?: (
            to: string,
            value: BigNumber,
            asset: Asset,
            options?: Options
        ) => PromiEvent<string>,
    ) => PromiEvent<string>;
}
