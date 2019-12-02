import BigNumber from "bignumber.js";

import { BCHHandler } from "./handlers/BCHHandler";
import { BTCHandler } from "./handlers/BTCHandler";
import { ETHHandler } from "./handlers/ETHHandler";
import { ZECHandler } from "./handlers/ZECHandler";
import { PromiEvent } from "./lib/promiEvent";
import { strip0x } from "./lib/utils";
import { Asset, DeferHandler, Handler, HandlerClass, Value } from "./types/types";

interface ConstructorOptions {
    network?: string;
    defaultAsset?: Asset;
    extraHandlers?: readonly HandlerClass[];
}

export default class CryptoAccount {

    public static readonly newPrivateKey = () => {
        // @ts-ignore
        if (typeof window !== "undefined") {
            // @ts-ignore
            console.log(`Inside window branch!`, window);
            const array = new Uint32Array(32);
            // @ts-ignore
            window.crypto.getRandomBytes(array);
            return new Buffer(array).toString("hex");
        } else {
            return require("crypto").randomBytes(32).toString("hex");
        }
    }

    private readonly handlers: Array<{ handler: Handler, priority: number }> = [];
    private readonly privateKey: string;
    private readonly network: string;
    private readonly defaultAsset: Asset | undefined;
    private readonly constructorOptions: ConstructorOptions | undefined;

    private sharedState: any;

    constructor(privateKey: string, options: ConstructorOptions) {
        this.privateKey = strip0x(privateKey); // Buffer.from(privateKey, "base64").toString("hex");
        this.network = options && options.network || 'mainnet';
        this.constructorOptions = options;
        this.sharedState = {};
        this.registerHandler(BTCHandler, 0);
        this.registerHandler(ZECHandler, 0);
        this.registerHandler(BCHHandler, 0);
        this.registerHandler(ETHHandler, 0);
        if (options && options.extraHandlers) {
            for (const handler of options.extraHandlers) {
                this.registerHandler(handler);
            }
        }
        this.defaultAsset = options && options.defaultAsset;
    }

    public readonly registerHandler = (handlerClass: HandlerClass, priorityIn?: number) => {
        const priority = priorityIn === undefined ?
            (this.handlers.length === 0 ? 0 : this.handlers[this.handlers.length - 1].priority) :
            priorityIn;
        const lastPosition = this.handlers.reduce((index, item, currentIndex) => item.priority <= priority ? currentIndex + 1 : index, 0);
        this.handlers.splice(lastPosition, 0, { handler: new handlerClass(this.privateKey, this.network, this.constructorOptions, this.sharedState), priority });
    }

    public readonly address = async <Options extends {} = {}>(asset?: Asset, options?: Options) => {
        return this.deferHandler().address(asset || this.defaultAsset, options);
    };

    public readonly balanceOf = async <T = number, Options extends { address?: string, bn?: new (v: string) => T } = {}>(asset?: Asset, options?: Options): Promise<T> => {
        const bn = await this.deferHandler().balanceOf(asset || this.defaultAsset, options);
        return (options && options.bn ? new options.bn(bn.toFixed()) : bn.toNumber()) as T;
    };

    public readonly balanceOfInSats = async <T = number, Options extends { address?: string, bn?: new (v: string) => T } = {}>(asset?: Asset, options?: Options): Promise<T> => {
        const bn = await this.deferHandler().balanceOfInSats(asset || this.defaultAsset, options);
        return (options && options.bn ? new options.bn(bn.toFixed()) : bn.toNumber()) as T;
    };

    public readonly send = <Options extends {} = {}>(
        to: string,
        value: Value,
        asset?: Asset,
        options?: Options
    ): PromiEvent<string> => {
        return this.deferHandler().send(to, new BigNumber(value.toString()), asset || this.defaultAsset, options);
    };

    public readonly sendSats = <Options extends {} = {}>(
        to: string,
        value: Value,
        asset?: Asset,
        options?: Options
    ): PromiEvent<string> => {
        return this.deferHandler().sendSats(to, new BigNumber(value.toString()), asset || this.defaultAsset, options);
    };

    private readonly deferHandler = (thisHandler?: Asset): DeferHandler => {
        return {
            address: (
                deferredAsset: Asset,
                deferredOptions?: any,
            ) => {
                const nextHandler = this.findHandler(deferredAsset, thisHandler);
                if (nextHandler.address) {
                    return nextHandler.address(deferredAsset, deferredOptions, this.deferHandler(nextHandler));
                } else {
                    return this.deferHandler(nextHandler).address(deferredAsset, deferredOptions);
                }
            },
            balanceOf: (
                deferredAsset: Asset,
                deferredOptions?: any,
            ) => {
                const nextHandler = this.findHandler(deferredAsset, thisHandler);
                if (nextHandler.balanceOf) {
                    return nextHandler.balanceOf(deferredAsset, deferredOptions, this.deferHandler(nextHandler));
                } else {
                    return this.deferHandler(nextHandler).balanceOf(deferredAsset, deferredOptions);
                }
            },
            balanceOfInSats: (
                deferredAsset: Asset,
                deferredOptions?: any,
            ) => {
                const nextHandler = this.findHandler(deferredAsset, thisHandler);
                if (nextHandler.balanceOfInSats) {
                    return nextHandler.balanceOfInSats(deferredAsset, deferredOptions, this.deferHandler(nextHandler));
                } else {
                    return this.deferHandler(nextHandler).balanceOfInSats(deferredAsset, deferredOptions);
                }
            },
            send: (
                deferredTo: string,
                deferredValue: BigNumber,
                deferredAsset: Asset,
                deferredOptions?: any
            ) => {
                const nextHandler = this.findHandler(deferredAsset, thisHandler);
                if (nextHandler.send) {
                    return nextHandler.send(deferredTo, deferredValue, deferredAsset, deferredOptions, this.deferHandler(nextHandler));
                } else {
                    return this.deferHandler(nextHandler).send(deferredTo, deferredValue, deferredAsset, deferredOptions);
                }
            },
            sendSats: (
                deferredTo: string,
                deferredValue: BigNumber,
                deferredAsset: Asset,
                deferredOptions?: any
            ) => {
                const nextHandler = this.findHandler(deferredAsset, thisHandler);
                if (nextHandler.sendSats) {
                    return nextHandler.sendSats(deferredTo, deferredValue, deferredAsset, deferredOptions, this.deferHandler(nextHandler));
                } else {
                    return this.deferHandler(nextHandler).sendSats(deferredTo, deferredValue, deferredAsset, deferredOptions);
                }
            }
        }
    }

    private readonly findHandler = (asset: Asset, from?: Asset): Handler => {
        const fromIndex = from ? this.handlers.indexOf(from) : -1;
        for (
            let i = (fromIndex === -1 ? this.handlers.length : fromIndex) - 1;
            i >= 0;
            i--
        ) {
            const handler = this.handlers[i].handler;
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
