import BigNumber from "bignumber.js";

import { BTCHandler } from "./handlers/BTCHandler";
import { PromiEvent } from "./promiEvent";
import { Asset, Handler, Value } from "./types/types";

// TODO: Figure out how to represent class objects;
type HandlerClass = any;
type NumClass = any;

export default class CryptoAccount {
    // tslint:disable-next-line: readonly-array
    private readonly handlers: Handler[] = [];
    private readonly privateKey: string;
    private readonly network: string;

    constructor(privateKey: string, network?: string, extraHandlers?: readonly HandlerClass[]) {
        this.privateKey = privateKey;
        this.network = network || 'mainnet';
        this.registerHandler(BTCHandler);
        // this.registerHandler(BCHHandler);
        // this.registerHandler(ZECHandler);
        // this.registerHandler(ETHandERC20Handler);
        if (extraHandlers) {
            for (const handler of extraHandlers) {
                this.registerHandler(handler);
            }
        }
    }

    public readonly registerHandler = (handlerClass: HandlerClass) => {
        this.handlers.push(new handlerClass(this.privateKey, this.network));
    }

    public readonly balanceOf = async (asset: Asset, address?: string, Num?: NumClass) => {
        const defer = (thisHandler?: Handler) => (deferredAsset: Asset, deferredAddress?: string): Promise<BigNumber> => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            if (nextHandler.balanceOf) {
                return nextHandler.balanceOf(deferredAsset, deferredAddress, defer(nextHandler));
            } else {
                return defer(nextHandler)(asset, address);
            }
        };
        const bn = await defer()(asset);
        return Num ? new Num(bn.toFixed()) : bn.toNumber();
    };

    public readonly balanceOfInSats = async (asset: Asset, address?: string, Num?: NumClass) => {
        const defer = (thisHandler?: Handler) => (deferredAsset: Asset, deferredAddress?: string): Promise<BigNumber> => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            if (nextHandler.balanceOfInSats) {
                return nextHandler.balanceOfInSats(deferredAsset, deferredAddress, defer(nextHandler));
            } else {
                return defer(nextHandler)(asset, address);
            }
        };
        const bn = await defer()(asset);
        return Num ? new Num(bn.toFixed()) : bn.toNumber();
    };

    public readonly send = async (
        to: string | Buffer,
        value: Value,
        asset: Asset,
        options?: any
    ) => {
        const defer = (thisHandler?: Handler) => (
            deferredTo: string | Buffer,
            deferredValue: BigNumber,
            deferredAsset: Asset,
            deferredOptions?: any
        ): PromiEvent<string> => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            if (nextHandler.send) {
                return nextHandler.send(
                    deferredTo,
                    deferredValue,
                    deferredAsset,
                    deferredOptions,
                    defer(nextHandler)
                );
            } else {
                return defer(nextHandler)(
                    deferredTo,
                    deferredValue,
                    deferredAsset,
                    deferredOptions,
                );
            }
        };
        return defer()(to, new BigNumber(value.toString()), asset, options);
    };

    public readonly sendSats = async (
        to: string | Buffer,
        value: Value,
        asset: Asset,
        options?: any
    ) => {
        const defer = (thisHandler?: Handler) => (
            deferredTo: string | Buffer,
            deferredValue: BigNumber,
            deferredAsset: Asset,
            deferredOptions?: any
        ): PromiEvent<string> => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            if (nextHandler.sendSats) {
                return nextHandler.sendSats(
                    deferredTo,
                    deferredValue,
                    deferredAsset,
                    deferredOptions,
                    defer(nextHandler)
                );
            } else {
                return defer(nextHandler)(
                    deferredTo,
                    deferredValue,
                    deferredAsset,
                    deferredOptions,
                );
            }
        };
        return defer()(to, new BigNumber(value.toString()), asset, options);
    };

    private readonly findHandler = (asset: Asset, from?: Asset): Handler => {
        const fromIndex = from ? this.handlers.indexOf(from) : -1;
        for (
            let i = (fromIndex === -1 ? this.handlers.length : fromIndex) - 1;
            i >= 0;
            i--
        ) {
            const handler = this.handlers[i];
            if (handler.handlesAsset(asset)) {
                return handler;
            }
        }
        let assetString;
        try {
            assetString = JSON.stringify(asset);
        } catch (error) {
            assetString = (asset && (asset as any).name) || asset;
        }
        throw new Error(`Unsupported asset ${assetString}`);
    };
}
