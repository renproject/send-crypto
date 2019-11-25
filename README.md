<img alt="send crypto" src="./send-crypto.svg" width="200px" />

A minimal JavaScript library for sending crypto assets.

Currently doesn't support hierarchical or single-use addresses.

## Supported assets

1. BTC
2. BCH
3. ZEC (transparent txs only)
4. ETH
5. ERC20 tokens

<br /><br /><hr />

1. [Usage](#usage)
1. [Blockchain specific instructions](#Blockchain-specific-instructions)
1. [Examples](#examples)
1. [Custom assets](#custom-assets)

<hr /><br /><br />

# Usage

Basic usage:

```ts
const CryptoAccount = require("send-crypto");

const account = new CryptoAccount(process.env.PRIVATE_KEY);

console.log(await account.balanceOf("BTC"));
// > 0.01

await account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.01, "BTC")
    .on("transactionHash", console.log)
// > "3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688"
    .on("confirmation", console.log);
// > 1
// > 2 ...
```

Specification:

```ts
type Asset = "BTC" | "BCH" | "ZEC" | "ETH" | { type: "ERC20", address?: "0x408...", name?: "REN" };

type TxOptions = {/* see per-blockchain instructions */};

type Value = number | string | BigNumber | BN;

class CryptoAccount {
    constructor(privateKey: string, network?: "mainnet" | "testnet" | EthNetwork) {};

    address(asset: Asset): Promise<string>;

    balanceOf(asset: Asset, address?: string): Promise<number>;
    // Optionally provide a big-number class:
    balanceOf<Num = number>(asset: Asset, address?: string, bn?: { new(s: string): Num }): Promise<Num>;
    balanceOfInSats<Num = number>(asset: Asset, address?: string, bn?: { new(s: string): Num }): Promise<Num>;

    send(to: string, value: Value, asset: Asset, options?: TxOptions):
        PromiEvent<string>;
    sendSats(to: string, v: Value, asset: Asset, options?: TxOptions):
        PromiEvent<string>;
}
```

Notes:

* **Testnet**: A network can be provided in the constructor. If network is `testnet`, `ropsten` is used for ETH. If it's set to an Ethereum testnet (`ropsten`, `kovan`, etc.), testnet will be used for all assets (ETH, BTC, etc.).
* `to` should be provided in whatever format is standard for the asset (base58 for BTC, hex for ETH, etc.).
* `sendSats` will treat `value` as the smallest unit of the asset (satoshis for BTC, wei for ETH, etc.). `balanceOfInSats` will return the balance in the smallest unit.

PromiEvent definition:

```ts
interface PromiEvent<T> extends Promise<T> {
    on("transactionHash", (hash: string) => void): void;
    on("confirmation", (confirmations: number) => void): void;
    // ETH only
    on("receipt", (receipt: TransactionReceipt) => void): void;
}
```

<hr /><br /><br />

# Blockchain specific instructions

### BTC, BCH, ZEC

The fee defaults to 10 000 sats/zats. It can be overridden by passing in an extra options argument.

```ts
interface TxOptions {
    fee?: number;      // defaults to 10000
}
```

### ETH, ERC20

A few well known ERC20 tokens are provided by name.

```ts
import { TransactionReceipt } from "web3-core";

type EthNetwork = "mainnet" | "ropsten" | "kovan" | "rinkeby" | "gorli";

interface TxOptions {
    from?: string | number;
    to?: string;
    value?: number | string | BN;
    gas?: number | string;
    gasPrice?: number | string | BN;
    data?: string;
    nonce?: number;
    chainId?: number;
}
```

<hr /><br /><br />

# Examples

### Setup

`.env`:
```sh
PRIVATE_KEY="1234512341"
```

```ts
require("dotenv").config();
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);
```

<hr />

### Use testnet

```ts
// Use "testnet" BTC, BCH & ZEC; use "ropsten" ETH.
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, "testnet");
```
```ts
// Same as above
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, "ropsten");
```
```ts
// Use "testnet" BTC, BCH & ZEC; use "kovan" ETH.
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, "kovan");
```


### Send entire BTC balance

```ts
const balance = await account.balanceOf("BTC");
await account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", balance, "BTC");

// Or using sats as the unit
const balanceInSats = await account.balanceOfInSats("BTC");
await account.sendSats("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", balanceInSats, "BTC");
```

### Send an ERC20 token

```ts
await account.send(
    "0x05a56e2d52c817161883f50c441c3228cfe54d9f",
    1.234,
    { type: "ERC20", address: "0x408e41876cccdc0f92210600ef50372656052a38" },
);

await account.send(
    "0x05a56e2d52c817161883f50c441c3228cfe54d9f",
    1.234,
    { type: "ERC20", address: "DAI" },
);
```

<hr /><br /><br /><br /><br /><br /><br />

# Custom assets

You can add support for custom assets by implementing a handler:

```ts
export interface Handler<Options = {}> {
    // Returns whether or not this can handle the asset
    handlesAsset: (asset: Asset) => boolean;

    address?: (asset: Asset, defer?) => Promise<string>;

    // Balance
    balanceOf?: (asset: Asset, address?: string, defer?) => Promise<BigNumber>;
    balanceOfInSats?: (asset: Asset, address?: string, defer?) => Promise<BigNumber>;

    // Transfer
    send?: (
        to: string | Buffer, value: BigNumber, asset: Asset,
        options?: Options, defer?
    ) => PromiEvent<string>;
    sendSats?: (
        to: string | Buffer, value: BigNumber, asset: Asset,
        options?: Options, defer?
    ) => PromiEvent<string>;
}
```

And then register the handler:

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);
account.registerHandler(MyCystomHandler);
```

The handler will be used for any asset for which `handlesAsset` returns true. You can wrap around other handlers by using the `defer` parameter passed in to each function.

For example, to add support for ENS names for Ethereum, you could resolve the `to` address and then call `defer`.

See the following handlers as references:

* [BTC Handler](./src/handlers/BTCHandler.ts)