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
    public readonly handlesAsset = (asset: Asset): boolean => {
        return asset === 'BTC';
    };

    // Balance
    public readonly balanceOf = async (asset: Asset, address?: string): Promise<BigNumber> => {
        return (await this.balanceOfInSats(asset)).dividedBy(
            new BigNumber(10).exponentiatedBy(8)
        );
    };

    public readonly balanceOfInSats = (asset: Asset, address?: string): Promise<BigNumber> => {
        return Promise.resolve(new BigNumber(0));
    };

    // Transfer
    public readonly send = (
        to: string | Buffer,
        value: BigNumber,
        asset: Asset,
        options?: Options
    ): PromiEvent<string> => {
        return this.sendSats(
            to,
            value.times(new BigNumber(10).exponentiatedBy(8)),
            asset,
            options
        );
    };

    public readonly sendSats = (
        to: string | Buffer,
        value: BigNumber,
        asset: Asset,
        options?: Options
    ): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>();
        promiEvent.resolve('');
        promiEvent.emit('transactionHash', '0x1234');
        promiEvent.emit('confirmations', 1);
        return promiEvent;
    };
}
