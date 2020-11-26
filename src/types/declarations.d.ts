declare module "bitgo-utxo-lib";
declare module "@zondax/filecoin-signing-tools/js";
// declare module "@glif/filecoin-rpc-client";
// declare module "@glif/filecoin-number";
// declare module "@glif/filecoin-wallet-provider";
// declare module "glif__filecoin-rpc-client";

declare module "@glif/filecoin-rpc-client" {
    type LotusRpcEngine = any;
    const LotusRpcEngine: LotusRpcEngine;
    export default LotusRpcEngine;
    export type Config = any;
    export const Config: Config;
}

declare module "@glif/filecoin-number" {
    export type FilecoinNumber = any;
    export const FilecoinNumber: FilecoinNumber;
}

declare module "glif__filecoin-rpc-client";

declare module "@glif/filecoin-rpc-client" {
    export type LotusRpcEngineConfig = any;
}
