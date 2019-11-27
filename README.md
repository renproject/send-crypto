<img alt="send crypto" src="./send-crypto.svg" width="200px" />

<hr />

A minimal JavaScript library for sending crypto assets.

Currently doesn't support hierarchical or single-use addresses.

## Supported assets

* BTC

Planned:

* BCH
* ZEC (transparent txs only)
* ETH
* ERC20 tokens

<br /><br />

# Usage

Basic usage:

```ts
const CryptoAccount = require("send-crypto");

const account = new CryptoAccount(process.env.PRIVATE_KEY);

console.log(await account.address("BTC"));
// > "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"

console.log(await account.balanceOf("BTC"));
// > 0.01

await account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.01, "BTC")
    .on("transactionHash", console.log)
// > "3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688"
    .on("confirmation", console.log);
// > 1
// > 2 ...
```

**UNITS**: `balanceOf` and `send` can be replaced with `balanceOfInSats` and `sendSats` respectively to use the blockchain's smallest units (satoshis for BTC, wei for ETH, etc.).

**TESTNET**: A network can be provided in the constructor. If network is `testnet`, `ropsten` is used for ETH. If it's set to an Ethereum testnet (`ropsten`, `kovan`, etc.), testnet will be used for all assets (ETH, BTC, etc.).

**CONFIG**: Each of the functions `address`, `balanceOf` and `send` accept an optional `options` parameter. See the available options [below](#all-options).

<br /><br />

# Examples

## Setup

<details>
<summary>Load private key from a .env file</summary>

`.env`:
```sh
PRIVATE_KEY="1234512341"
```

```ts
require("dotenv").config();
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);
```

</details>

<details>
<summary>Create new account</summary>

Or create a new account:

```ts
const privateKey = CryptoAccount.newPrivateKey();
console.log(`Save your key somewhere: ${privateKey}`);
const account = new CryptoAccount(privateKey);
```

</details>


## BTC, ZEC, BCH examples

You can replace `"BTC"` with `"ZEC"` or `"BCH"` in the following examples

<details>
<summary>Use testnet</summary>

```ts
// Use "testnet" BTC, BCH & ZEC
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, { network: "testnet" });
```

</details>

<details>
<summary>Send entire balance</summary>

<!-- ### Send entire BTC balance -->

```ts
const balance = await account.balanceOf("BTC");
await account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", balance, "BTC", { subtractFee: true });

// Or using sats as the unit
const balanceInSats = await account.balanceOfInSats("BTC");
await account.sendSats("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", balanceInSats, "BTC", { subtractFee: true });
```

</details>


<details>
<summary>Wait for 6 confirmations</summary>

```ts
await new Promise((resolve, reject) => 
    account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.01, "BTC")
        .on("confirmation", confirmations => { if (confirmations >= 6) { resolve(); } })
        .catch(reject);
);
```
</details>


## ETH, ERC20 examples

<details>
<summary>Use testnet</summary>

```ts
// Use "testnet" BTC, BCH & ZEC; use "ropsten" ETH.
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, { network: "testnet" });
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, { network: "ropsten" });
```
```ts
// Use "testnet" BTC, BCH & ZEC; use "kovan" ETH.
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, { network: "kovan" });
```

</details>

<details>
<summary>Send an ERC20 token</summary>

```ts
await account.send(
    "0x05a56e2d52c817161883f50c441c3228cfe54d9f",
    1.234,
    { type: "ERC20", address: "0x408e41876cccdc0f92210600ef50372656052a38" },
);

// A few well known ERC20 tokens can be referenced by name:
await account.send("0x05a56e2d52c817161883f50c441c3228cfe54d9f", 1.234, "DAI");
```

</details>

<br /><br />

# All options

<details>
<summary style="font-size: 20px;">BTC, ZEC & BCH options</summary>

The `balanceOf` and `balanceOfInSats` options are:

```ts
{
    // Get the balance of an address other than the current account's
    address?: string;

    // The number of confirmations UTXOs must have to be included in the balance
    confirmations?: number; // defaults to 0
}
```

The `send` and `sendSats` options are:

```ts
{
    // The number of confirmations UTXOs must have to be included in the inputs
    confirmations?: number; // defaults to 0

    // The fee in satoshis to use
    fee?: number;           // defaults to 10000

    // Whether the fee should be included or excluded from `value`
    subtractFee?: boolean;  // defaults to false
}
```

</details>

<details>
<summary style="font-size: 20px;">ETH & ERC20 options</summary>

A few well known ERC20 tokens can be referenced by name. All others can be used by providing an address.

<details>
<summary>Known ERC20 tokens</summary>
    <details>
    <summary>Mainnet</summary>
    DAI: <a href="https://ethersca.io/token/0x6b175474e89094c44da98b954eedeac495271d0f">0x6b175474e89094c44da98b954eedeac495271d0f</a>
    </details>
</details>

The supported testnets are `mainnet`, `ropsten`, `kovan`, `rinkeby` and `gorli`.

The `balanceOf` and `balanceOfInSats` options are:

```ts
{
    // Get the balance of an address other than the current account's
    address?: string;
}
```

The `send` and `sendSats` options are:

```ts
{
    // Gas limit
    gas?: number | string;

    // Gas price in WEI
    gasPrice?: number | string | BN;

    // Include data with the transfer
    data?: string;

    // Override the transaction nonce
    nonce?: number;
}
```

</details>


<br /><br /><br /><br /><br /><br />

# Custom assets

If you want to send a cryptocurrency or token that isn't supported by the library, or enhance support for one of the assets above, you can write your own handler using the instructions below.

<details>
<summary style="font-size: 20px;">Adding custom assets</summary>

You can add support for custom assets by implementing a handler:

```ts
export interface Handler<
    AddressOptions = {},
    BalanceOptions extends { address?: string } = { address?: string },
    TxOptions = {},
> {
    // Returns whether or not this can handle the asset
    handlesAsset: (asset: Asset) => boolean;

    address?: (asset: Asset, options?: AddressOptions, defer?) => Promise<string>;

    // Balance
    balanceOf?: (asset: Asset, options?: BalanceOptions, defer?) => Promise<BigNumber>;
    balanceOfInSats?: (asset: Asset, options?: BalanceOptions, defer?) => Promise<BigNumber>;

    // Transfer
    send?: (
        to: string | Buffer, value: BigNumber, asset: Asset, options?: TxOptions, defer?
    ) => PromiEvent<string>;
    sendSats?: (
        to: string | Buffer, value: BigNumber, asset: Asset, options?: TxOptions, defer?
    ) => PromiEvent<string>;
}
```

And then register the handler:

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);
account.registerHandler(MyCystomHandler);
```

The handler will be used for any asset for which `handlesAsset` returns true. You can wrap around other handlers by using the `defer` parameter passed in to each function (passing in the same arguments except `defer`). `registerHandler` accepts an optional parameter for setting the order of handlers (see [`index.ts`](./src/index.ts) to see the default ordering).

For example, to add support for ENS names for Ethereum, you can resolve the `to` address and then call `defer`:

```ts
class ENSResolver {
    /* ... */

    resolveENSName = (to: string): Promise<string> => { /* ... */ }

    send = async (
        to: string, value: BigNumber, asset: Asset, defer: (to, value, asset) => PromiEvent<string>
    ): PromiEvent<string> => {
        return defer(await resolveENSName(to), value, asset);
    }
}
```

See the following handlers as references:

* [BTC Handler](./src/handlers/BTCHandler.ts)

</details>