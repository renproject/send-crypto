import BigNumber from "bignumber.js";

import { newPromiEvent, PromiEvent } from "../promiEvent";
import { Asset, Handler, Value } from "../types/types";

interface Options {
    readonly fee?: number;
}

export class BTCHandler implements Handler {
    private readonly privateKey: string;
    private readonly network: string;

    constructor(privateKey: string, network: string) {
        this.privateKey = privateKey;
        this.network = network;
    }

    // Returns whether or not this can handle the asset
    readonly handlesAsset = (asset: Asset): boolean => {
        return asset === "BTC";
    }

    // Balance
    readonly balanceOf = (asset: Asset): Promise<BigNumber> => {
        return Promise.resolve(new BigNumber(0));
    }

    readonly balanceOfInSats = (asset: Asset): Promise<BigNumber> => {
        return Promise.resolve(new BigNumber(0));
    };

    // Transfer
    readonly send = (to: string | Buffer, value: Value, asset: Asset, options?: Options): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>()
        promiEvent.resolve("");
        return promiEvent;
    };
    readonly sendSats = (to: string | Buffer, value: Value, asset: Asset, options?: Options): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>()
        promiEvent.resolve("");
        return promiEvent;
    };
}