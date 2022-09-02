import BigNumber from "bignumber.js";

import { BCHHandler } from "./handlers/BCH/BCHHandler";
import { BTCHandler } from "./handlers/BTC/BTCHandler";
import { ERC20Handler } from "./handlers/ERC20/ERC20Handler";
import { ETHHandler } from "./handlers/ETH/ETHHandler";
import { FILHandler } from "./handlers/FIL/FILHandler";
import { LTCHandler } from "./handlers/LTC/LTCHandler";
import { TERRAHandler } from "./handlers/TERRA/TERRAHandler";
import { ZECHandler } from "./handlers/ZEC/ZECHandler";
import { PromiEvent } from "./lib/promiEvent";
import { strip0x, toHex } from "./lib/utils";
import {
    Asset,
    DeferHandler,
    Handler,
    HandlerClass,
    Value,
} from "./types/types";

export { UTXO } from "./lib/utxo";

interface ConstructorOptions {
    network?: string;
    defaultAsset?: Asset;
    extraHandlers?: readonly HandlerClass[];
}

export default class CryptoAccount {
    private readonly handlers: Array<{
        handler: Handler;
        priority: number;
    }> = [];
    private readonly privateKey: string;
    private readonly network: string;
    private readonly defaultAsset: Asset | undefined;
    private readonly constructorOptions: ConstructorOptions | undefined;

    private sharedState: any;

    constructor(
        privateKey: string | Uint8Array,
        options?: ConstructorOptions & { [key: string]: any }
    ) {
        this.privateKey = strip0x(
            privateKey instanceof Uint8Array ? toHex(privateKey) : privateKey
        );
        this.network = (options && options.network) || "mainnet";
        this.constructorOptions = options;
        this.sharedState = {};
        this.registerHandler(BTCHandler, 0);
        this.registerHandler(ZECHandler, 10);
        this.registerHandler(BCHHandler, 20);
        this.registerHandler(ETHHandler, 30);
        this.registerHandler(FILHandler, 40);
        this.registerHandler(TERRAHandler, 50);
        this.registerHandler(ERC20Handler, 60);
        this.registerHandler(LTCHandler, 60);
        if (options && options.extraHandlers) {
            for (const handler of options.extraHandlers) {
                this.registerHandler(handler);
            }
        }
        this.defaultAsset = options && options.defaultAsset;
    }

    public readonly registerHandler = (
        handlerClass: HandlerClass,
        priorityIn?: number
    ) => {
        const priority =
            priorityIn === undefined
                ? this.handlers.length === 0
                    ? 0
                    : this.handlers[this.handlers.length - 1].priority
                : priorityIn;
        const lastPosition = this.handlers.reduce(
            (index, item, currentIndex) =>
                item.priority <= priority ? currentIndex + 1 : index,
            0
        );
        this.handlers.splice(lastPosition, 0, {
            handler: new handlerClass(
                this.privateKey,
                this.network,
                this.constructorOptions,
                this.sharedState
            ),
            priority,
        });
    };

    public readonly address = async <Options extends {} = {}>(
        assetIn?: Asset,
        options?: Options
    ) => {
        const asset = assetIn || this.defaultAsset;
        if (!asset) {
            throw new Error(`Must provide an asset`);
        }
        return this.deferHandler().address(asset, options);
    };

    public readonly getBalance = async <
        T = number,
        Options extends { address?: string; bn?: new (v: string) => T } = {}
    >(
        assetIn?: Asset,
        options?: Options
    ): Promise<T> => {
        const asset = assetIn || this.defaultAsset;
        if (!asset) {
            throw new Error(`Must provide an asset`);
        }
        const bn = await this.deferHandler().getBalance(asset, options);
        return (
            options && options.bn ? new options.bn(bn.toFixed()) : bn.toNumber()
        ) as T;
    };
    // tslint:disable-next-line: member-ordering
    public readonly balanceOf = this.getBalance;

    public readonly getBalanceInSats = async <
        T = number,
        Options extends { address?: string; bn?: new (v: string) => T } = {}
    >(
        assetIn?: Asset,
        options?: Options
    ): Promise<T> => {
        const asset = assetIn || this.defaultAsset;
        if (!asset) {
            throw new Error(`Must provide an asset`);
        }
        const bn = await this.deferHandler().getBalanceInSats(asset, options);
        return (
            options && options.bn ? new options.bn(bn.toFixed()) : bn.toNumber()
        ) as T;
    };
    // tslint:disable-next-line: member-ordering
    public readonly balanceOfInSats = this.getBalanceInSats;

    public readonly send = <Options extends {} = {}>(
        to: string,
        value: Value,
        assetIn?: Asset,
        options?: Options
    ): PromiEvent<string> => {
        const asset = assetIn || this.defaultAsset;
        if (!asset) {
            throw new Error(`Must provide an asset`);
        }
        return this.deferHandler().send(
            to,
            new BigNumber(value.toString()),
            asset,
            options
        );
    };

    public readonly sendSats = <Options extends {} = {}>(
        to: string,
        value: Value,
        assetIn?: Asset,
        options?: Options
    ): PromiEvent<string> => {
        const asset = assetIn || this.defaultAsset;
        if (!asset) {
            throw new Error(`Must provide an asset`);
        }
        return this.deferHandler().sendSats(
            to,
            new BigNumber(value.toString()),
            asset,
            options
        );
    };

    private readonly deferHandler = (thisHandler?: Handler): DeferHandler => {
        return {
            address: (deferredAsset: Asset, deferredOptions?: any) => {
                const nextHandler = this.findHandler(
                    deferredAsset,
                    thisHandler
                );
                if (nextHandler.address) {
                    return nextHandler.address(
                        deferredAsset,
                        deferredOptions || {},
                        this.deferHandler(nextHandler)
                    );
                } else {
                    return this.deferHandler(nextHandler).address(
                        deferredAsset,
                        deferredOptions
                    );
                }
            },
            getBalance: (deferredAsset: Asset, deferredOptions?: any) => {
                const nextHandler = this.findHandler(
                    deferredAsset,
                    thisHandler
                );
                if (nextHandler.getBalance) {
                    return nextHandler.getBalance(
                        deferredAsset,
                        deferredOptions || {},
                        this.deferHandler(nextHandler)
                    );
                } else {
                    return this.deferHandler(nextHandler).getBalance(
                        deferredAsset,
                        deferredOptions
                    );
                }
            },
            getBalanceInSats: (deferredAsset: Asset, deferredOptions?: any) => {
                const nextHandler = this.findHandler(
                    deferredAsset,
                    thisHandler
                );
                if (nextHandler.getBalanceInSats) {
                    return nextHandler.getBalanceInSats(
                        deferredAsset,
                        deferredOptions || {},
                        this.deferHandler(nextHandler)
                    );
                } else {
                    return this.deferHandler(nextHandler).getBalanceInSats(
                        deferredAsset,
                        deferredOptions
                    );
                }
            },
            send: (
                deferredTo: string,
                deferredValue: BigNumber,
                deferredAsset: Asset,
                deferredOptions?: any
            ) => {
                const nextHandler = this.findHandler(
                    deferredAsset,
                    thisHandler
                );
                if (nextHandler.send) {
                    return nextHandler.send(
                        deferredTo,
                        deferredValue,
                        deferredAsset,
                        deferredOptions || {},
                        this.deferHandler(nextHandler)
                    );
                } else {
                    return this.deferHandler(nextHandler).send(
                        deferredTo,
                        deferredValue,
                        deferredAsset,
                        deferredOptions
                    );
                }
            },
            sendSats: (
                deferredTo: string,
                deferredValue: BigNumber,
                deferredAsset: Asset,
                deferredOptions?: any
            ) => {
                const nextHandler = this.findHandler(
                    deferredAsset,
                    thisHandler
                );
                if (nextHandler.sendSats) {
                    return nextHandler.sendSats(
                        deferredTo,
                        deferredValue,
                        deferredAsset,
                        deferredOptions || {},
                        this.deferHandler(nextHandler)
                    );
                } else {
                    return this.deferHandler(nextHandler).sendSats(
                        deferredTo,
                        deferredValue,
                        deferredAsset,
                        deferredOptions
                    );
                }
            },
        };
    };

    private readonly findHandler = (asset: Asset, from?: Handler): Handler => {
        const fromIndex = from
            ? this.handlers.findIndex((i) => i.handler === from)
            : -1;
        for (
            let i = (fromIndex === -1 ? this.handlers.length : fromIndex) - 1;
            i >= 0;
            i--
        ) {
            const handler = this.handlers[i].handler;
            // console.log(handler);
            if (handler.handlesAsset(asset)) {
                return handler;
            }
        }
        let assetString;
        try {
            assetString = JSON.stringify(asset);
        } catch (error: any) {
            assetString = (asset && (asset as any).name) || asset;
        }
        throw new Error(`Unsupported asset ${assetString}`);
    };
}

export const newPrivateKey = () => {
    // @ts-ignore
    try {
        // @ts-ignore
        const array = new Uint8Array(32);
        // @ts-ignore
        window.crypto.getRandomValues(array);
        return toHex(array);
    } catch (error: any) {
        // Ignore window error.
    }
    return require("crypto").randomBytes(32).toString("hex");
};

(CryptoAccount as any).newPrivateKey = newPrivateKey;

////////////////////////////////////////////////////////////////////////////////
// EXPORTS                                                                    //
// Based on https://github.com/MikeMcl/bignumber.js/blob/master/bignumber.js  //
////////////////////////////////////////////////////////////////////////////////

// tslint:disable: no-object-mutation

// tslint:disable-next-line: no-string-literal
(CryptoAccount as any).default = (CryptoAccount as any).CryptoAccount =
    CryptoAccount;

// AMD
try {
    // @ts-ignore
    if (typeof define === "function" && define.amd) {
        // @ts-ignore
        define(() => CryptoAccount);
    }
} catch (error: any) {
    /* ignore */
}

// Node.js and other environments that support module.exports.
try {
    // @ts-ignore
    if (typeof module !== "undefined" && module.exports) {
        module.exports = CryptoAccount;
    }
} catch (error: any) {
    /* ignore */
}

// Browser.
try {
    // @ts-ignore
    if (typeof window !== "undefined" && window) {
        // @ts-ignore
        (window as any).CryptoAccount = CryptoAccount;
    }
} catch (error: any) {
    /* ignore */
}
