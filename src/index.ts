import BigNumber from "bignumber.js";
import crypto from "crypto";

import { BTCHandler } from "./handlers/BTCHandler";
import { PromiEvent } from "./lib/promiEvent";
import { Asset, Handler, Value } from "./types/types";

type HandlerClass = new (privateKey: string, network: string) => Handler;

export default class CryptoAccount {

    public static readonly newPrivateKey = () => {
        return crypto.randomBytes(32).toString("hex");
    }

    // tslint:disable-next-line: readonly-array
    private readonly handlers: Handler[] = [];
    private readonly privateKey: string;
    private readonly network: string;
    private readonly defaultAsset: Asset | undefined;


    // tslint:disable-next-line: readonly-keyword
    constructor(privateKey: string, options?: { network?: string, defaultAsset?: Asset, extraHandlers?: readonly HandlerClass[] }) {
        this.privateKey = privateKey; // Buffer.from(privateKey, "base64").toString("hex");
        this.network = options && options.network || 'mainnet';
        this.registerHandler(BTCHandler);
        // this.registerHandler(BCHHandler);
        // this.registerHandler(ZECHandler);
        // this.registerHandler(ETHandERC20Handler);
        if (options && options.extraHandlers) {
            for (const handler of options.extraHandlers) {
                this.registerHandler(handler);
            }
        }
        this.defaultAsset = options && options.defaultAsset;
    }

    public readonly registerHandler = (handlerClass: HandlerClass) => {
        this.handlers.push(new handlerClass(this.privateKey, this.network));
    }

    public readonly address = async <Options extends {} = {}>(asset?: Asset, options?: Options) => {
        const defer = (thisHandler?: Handler) => (deferredAsset: Asset, deferredOptions?: any): Promise<string> => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            if (nextHandler.address) {
                return nextHandler.address(deferredAsset, deferredOptions, defer(nextHandler));
            } else {
                return defer(nextHandler)(deferredAsset, deferredOptions);
            }
        };
        return defer()(asset || this.defaultAsset, options);
    };

    // tslint:disable-next-line: readonly-keyword
    public readonly balanceOf = async <T = number, Options extends { address?: string, bn?: new (v: string) => T } = {}>(asset?: Asset, options?: Options): Promise<T> => {
        const defer = (thisHandler?: Handler) => (deferredAsset: Asset, deferredOptions?: any): Promise<BigNumber> => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            if (nextHandler.balanceOf) {
                return nextHandler.balanceOf(deferredAsset, deferredOptions, defer(nextHandler));
            } else {
                return defer(nextHandler)(deferredAsset, deferredOptions);
            }
        };
        const bn = await defer()(asset || this.defaultAsset, options);
        return (options && options.bn ? new options.bn(bn.toFixed()) : bn.toNumber()) as T;
    };

    // tslint:disable-next-line: readonly-keyword
    public readonly balanceOfInSats = async <T = number, Options extends { address?: string, bn?: new (v: string) => T } = {}>(asset?: Asset, options?: Options): Promise<T> => {
        const defer = (thisHandler?: Handler) => (deferredAsset: Asset, deferredOptions?: any): Promise<BigNumber> => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            if (nextHandler.balanceOfInSats) {
                return nextHandler.balanceOfInSats(deferredAsset, deferredOptions, defer(nextHandler));
            } else {
                return defer(nextHandler)(deferredAsset, deferredOptions);
            }
        };
        const bn = await defer()(asset || this.defaultAsset, options);
        return (options && options.bn ? new options.bn(bn.toFixed()) : bn.toNumber()) as T;
    };

    public readonly send = async <Options extends {} = {}>(
        to: string | Buffer,
        value: Value,
        asset?: Asset,
        options?: Options
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
        return defer()(to, new BigNumber(value.toString()), asset || this.defaultAsset, options);
    };

    public readonly sendSats = async <Options extends {} = {}>(
        to: string | Buffer,
        value: Value,
        asset?: Asset,
        options?: Options
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
        return defer()(to, new BigNumber(value.toString()), asset || this.defaultAsset, options);
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
