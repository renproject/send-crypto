<img alt="send crypto" src="./send-crypto.svg" width="200px" />

<hr />

A minimal JavaScript library for sending crypto assets.

Currently only supports single addresses per blockchain.

## Supported assets

1. BTC
2. BCH
3. ZEC (transparent txs only)
4. ETH
5. ERC20 tokens

# Usage

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

## Definitions

```ts
type Token = "BTC" | "BCH" | "ZEC" | "ETH" | { type: "ERC20", address?: "0x408...", name?: "REN" };

type TxOptions = {/* see per-blockchain instructions */};

type Value = number | string | BigNumber | BN;

class CryptoAccount {
    constructor(privateKey: string, network?: "mainnet" | "testnet" | EthNetwork) {};

    balanceOf(token: Token): Promise<number>;
    // Optionally provide a big-number class:
    balanceOf<Num = number>(token: Token, bn?: { new(s: string): Num }): Promise<Num>;
    balanceOfInSats<Num = number>(token: Token, bn?: { new(s: string): Num }): Promise<Num>;

    send(to: string, value: Value, token: Token, options?: TxOptions):
        PromiEvent<string>;
    sendSats(to: string, v: Value, token: Token, options?: TxOptions):
        PromiEvent<string>;
}
```

Notes: 

* A network can be provided in the constructor. If network is `testnet`, `ropsten` is used for ETH. If it's set to an Ethereum testnet (`ropsten`, `kovan`, etc.), testnet will be used for all assets (ETH, BTC, etc.).
* A few well known ERC20 tokens are provided by name.
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

# Blockchain specific instructions

### BTC, BCH, ZEC

Testnet can be used by passing in `true` as the last parameter of `send`.

```ts
interface TxOptions {
    fee?: number;      // defaults to 10000
}
```

### ETH, ERC20

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

<br /><hr /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />

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
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, "ropsten"); // same

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
await account.send("0x05a56e2d52c817161883f50c441c3228cfe54d9f", 1.234, { type: "ERC20", address: "0x408e41876cccdc0f92210600ef50372656052a38" });

await account.send("0x05a56e2d52c817161883f50c441c3228cfe54d9f", 1.234, { type: "ERC20", address: "DAI" });
```