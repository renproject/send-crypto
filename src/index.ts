import { BTCHandler } from "./handlers/BTCHandler";
import { Asset, Handler, Value } from "./types/types";

export default class CryptoAccount {
    // tslint:disable-next-line: readonly-array
    private readonly handlers: Handler[] = [];
    private readonly privateKey: string;
    private readonly network: string;

    constructor(privateKey: string, network?: string) {
        this.privateKey = privateKey;
        this.network = network || "mainnet";
        this.registerHandler(BTCHandler);
        // this.registerHandler(BCHHandler);
        // this.registerHandler(ZECHandler);
        // this.registerHandler(ETHandERC20Handler);
    }

    // tslint:disable-next-line: callable-types
    public registerHandler(HandlerClass: any) {
        this.handlers.push(new HandlerClass(this.privateKey, this.network));
    }

    public readonly balanceOf = async (asset: Asset, Num?: any) => {
        const defer = (thisHandler?: Handler) => (deferredAsset: Asset) => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            return nextHandler.balanceOf(deferredAsset, defer(nextHandler));
        }
        const bn = await defer()(asset);
        return Num ? new Num(bn.toFixed()) : bn.toNumber();
    }

    public readonly balanceOfInSats = async (asset: Asset, Num?: any) => {
        const defer = (thisHandler?: Handler) => (deferredAsset: Asset) => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            return nextHandler.balanceOfInSats(deferredAsset, defer(nextHandler));
        }
        const bn = await defer()(asset);
        return Num ? new Num(bn.toFixed()) : bn.toNumber();
    }

    public readonly send = async (to: string | Buffer, value: Value, asset: Asset, options?: any) => {
        const defer = (thisHandler?: Handler) => (deferredTo: string | Buffer, deferredValue: Value, deferredAsset: Asset, deferredOptions?: any) => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            return nextHandler.send(deferredTo, deferredValue, deferredAsset, deferredOptions, defer(nextHandler));
        }
        return defer()(to, value, asset, options);
    }

    public readonly sendSats = async (to: string | Buffer, value: Value, asset: Asset, options?: any) => {
        const defer = (thisHandler?: Handler) => (deferredTo: string | Buffer, deferredValue: Value, deferredAsset: Asset, deferredOptions?: any) => {
            const nextHandler = this.findHandler(deferredAsset, thisHandler);
            return nextHandler.sendSats(deferredTo, deferredValue, deferredAsset, deferredOptions, defer(nextHandler));
        }
        return defer()(to, value, asset, options);
    }

    private readonly findHandler = (asset: Asset, from?: Asset): Handler => {
        const fromIndex = from ? this.handlers.indexOf(from) : -1;
        for (let i = (fromIndex === -1 ? this.handlers.length : fromIndex) - 1; i >= 0; i--) {
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
    }
};
