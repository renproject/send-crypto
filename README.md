<img alt="send crypto" src="./send-crypto.svg" width="200px" />

<hr />

A minimal JavaScript library for sending crypto assets.

Currently doesn't support hierarchical or single-use addresses.

## Supported assets

-   <img style="margin-bottom: -5px;" height="20" width="20" src="./.github/icons/btc.png" /> BTC

-   <img style="margin-bottom: -5px;" height="20" width="20" src="./.github/icons/ltc.png" /> LTC

-   <img style="margin-bottom: -5px;" height="20" width="20" src="./.github/icons/zec.png" /> ZEC (transparent txs only)

-   <img style="margin-bottom: -5px;" height="20" width="20" src="./.github/icons/bch.png" /> BCH

-   <img style="margin-bottom: -5px;" height="20" width="20" src="./.github/icons/fil.png" /> FIL

-   <img style="margin-bottom: -5px;" height="20" width="20" src="./.github/icons/eth.png" /> ETH

-   <img style="margin-bottom: -5px;" height="20" width="20" src="./.github/icons/eth.png" /> ERC20 tokens

<br /><br />

# Usage

```sh
npm install --save send-crypto
# or
yarn add send-crypto
```

Replace "BTC" with any supported asset:

```ts
const CryptoAccount = require("send-crypto");

/* Load account from private key */
const privateKey = process.env.PRIVATE_KEY || CryptoAccount.newPrivateKey();
const account = new CryptoAccount(privateKey);

/* Print address */
console.log(await account.address("BTC"));
// > "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"

/* Print balance */
console.log(await account.getBalance("BTC"));
// > 0.01

/* Send 0.01 BTC */
const txHash = await account
    .send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.01, "BTC")
    .on("transactionHash", console.log)
    // > "3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688"
    .on("confirmation", console.log);
// > 1
// > 2 ...
```

**UNITS**: `getBalance` and `send` can be replaced with `getBalanceInSats` and `sendSats` respectively to use the blockchain's smallest units (satoshis for BTC, wei for ETH, etc.).

**CONFIG**: Each of the functions `address`, `getBalance` and `send` accept an optional `options` parameter. See the available options in the sections "All balance and transaction options" for each asset below.

<br /><br />

# Examples

## Setup

<details>
<hr />
<summary>Load private key from a .env file</summary>

`.env`:

```sh
PRIVATE_KEY="1234512341"
```

Use the `dotenv` library (installed with `npm i -D dotenv`) or run `source .env` before running:

```ts
require("dotenv").config();
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);
```

<hr />
</details>

<details>
<hr />
<summary>Create new account</summary>

```ts
const privateKey = CryptoAccount.newPrivateKey();
console.log(`Save your key somewhere: ${privateKey}`);
const account = new CryptoAccount(privateKey);
```

<hr />
</details>

## BTC, ZEC, BCH

<details>
<hr />
<summary>Send BTC (Bitcoin)</summary>

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);

// Send BTC
await account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.01, "BTC");
```

<hr />
</details>

<details>
<hr />
<summary>Send ZEC (Zcash)</summary>

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);

// Send ZEC
await account.send("t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd", 0.01, "ZEC");
```

<hr />
</details>

<details>
<hr />
<summary>Send BCH (Bitcoin Cash)</summary>

CashAddr, BitPay and legacy addresses are supported.

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);

// Send BCH
await account.send(
    "bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy",
    0.01,
    "BCH"
);
```

<hr />
</details>

You can replace `"BTC"` with `"ZEC"` or `"BCH"` in the following examples:

<details>
<hr />
<summary>Send entire balance</summary>

```ts
const balance = await account.getBalance("BTC");
await account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", balance, "BTC", {
    subtractFee: true,
});

// Or using sats as the unit
const balanceInSats = await account.getBalanceInSats("BTC");
await account.sendSats(
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    balanceInSats,
    "BTC",
    { subtractFee: true }
);
```

<hr />
</details>

<details>
<hr />
<summary>Wait for 6 confirmations</summary>

```ts
await new Promise((resolve, reject) =>
    account.send("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.01, "BTC")
        .on("confirmation", confirmations => { if (confirmations >= 6) { resolve(); } })
        .catch(reject);
);
```

<hr />
</details>

<details>
<hr />
<summary>Send testnet funds</summary>

```ts
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, {
    network: "testnet",
});
await testnetAccount.send("12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX", 0.01, "BTC");
```

<hr />
</details>

<details>
<hr />
<summary><b>All balance and transaction options</b></summary>

The `getBalance` and `getBalanceInSats` options are:

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

    // The fee in satoshis/zatoshis to use
    fee?: number;           // defaults to 10000

    // Whether the fee should be included or excluded from `value`
    subtractFee?: boolean;  // defaults to false
}
```

<hr />
</details>

## ETH, ERC20

<details>
<hr />
<summary>Send ETH (Ether, Ethereum)</summary>

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);

// Send ETH
await account.send("0x05a56e2d52c817161883f50c441c3228cfe54d9f", 0.01, "ETH");
```

<hr />
</details>

<details>
<hr />
<summary>Send ERC20 tokens</summary>

You can transfer arbitrary ERC20 tokens by providing the token's address:

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);

await account.send("0x05a56e2d52c817161883f50c441c3228cfe54d9f", 1.234, {
    type: "ERC20",
    address: "0x408e41876cccdc0f92210600ef50372656052a38",
});
```

A few well known ERC20 tokens can be referenced by name:

```ts
await account.send("0x05a56e2d52c817161883f50c441c3228cfe54d9f", 1.234, {
    type: "ERC20",
    name: "DAI",
});
```

See the [ERC20s.ts](./src/handlers/ERC20/ERC20s.ts) to see the tokens than can be referenced by name.

<hr />
</details>

<details>
<hr />
<summary>Send testnet funds (<i>ropsten</i>, <i>kovan</i>, etc.)</summary>

The supported testnets are `mainnet`, `ropsten`, `kovan`, `rinkeby` and `goerli`.

```ts
// Use "testnet" BTC, BCH & ZEC; use "ropsten" ETH.
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, {
    network: "testnet",
});
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, {
    network: "ropsten",
});
```

```ts
// Use "testnet" BTC, BCH & ZEC; use "kovan" ETH.
const testnetAccount = new CryptoAccount(process.env.PRIVATE_KEY, {
    network: "kovan",
});
```

<hr />
</details>

<details>
<hr />
<summary><b>All balance and transaction options</b></summary>

The `getBalance` and `getBalanceInSats` options are:

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

    // [ETH] Whether the fee should be included or excluded from `value`
    subtractFee?: boolean;  // defaults to false

    // [ERC20] Approve instead of transferring
    approve?: boolean; // defaults to false
}
```

<hr />
</details>

<br /><br /><br /><br /><br /><br />

# Custom assets

If you want to send a cryptocurrency or token that isn't supported by the library, or enhance support for one of the assets above (e.g. add support for a new address format), you can write your own handler using the instructions below.

<details>
<hr />
<summary style="font-size: 20px;">Adding custom assets</summary>

Handlers must implement the (TypeScript) interface below.

The `handlesAsset` function is called to ask if the handler can handle an asset.

All other functions are optional. If a function isn't provided, the next handler is called instead.

```ts
export abstract class Handler<
    ConstructorOptions = {},
    AddressOptions = {},
    BalanceOptions extends { address?: string } = { address?: string },
    TxOptions = {}
> {
    // sharedState allows multiple handlers access common state.
    constructor(
        privateKey: string,
        network: string,
        constructorOptions?: ConstructorOptions,
        sharedState?: any
    ) {
        /* */
    }

    // Returns whether or not this can handle the asset
    public handlesAsset!: (asset: Asset) => boolean;

    // Returns the address of the account
    public address?: (
        asset: Asset,
        options?: AddressOptions,
        deferHandler?: DeferHandler
    ) => Promise<string>;

    // Returns the balance of the account
    public getBalance?: (
        asset: Asset,
        options?: BalanceOptions,
        deferHandler?: DeferHandler
    ) => Promise<BigNumber>;
    public getBalanceInSats?: (
        asset: Asset,
        options?: BalanceOptions,
        deferHandler?: DeferHandler
    ) => Promise<BigNumber>;

    // Transfers the asset to the provided address
    public send?: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: TxOptions,
        deferHandler?: DeferHandler
    ) => PromiEvent<string>;
    public sendSats?: (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: TxOptions,
        deferHandler?: DeferHandler
    ) => PromiEvent<string>;
}
```

And then register the handler:

```ts
const CryptoAccount = require("send-crypto");
const account = new CryptoAccount(process.env.PRIVATE_KEY);
account.registerHandler(MyCystomHandler);
```

`registerHandler` accepts an optional `priority` parameter for setting the order of handlers (see [`index.ts`](./src/index.ts) to see the default ordering).

You can wrap around other handlers by using the `defer` parameter passed in to each function. For example, to add support for ENS names for Ethereum, you can resolve the `to` address and then call `defer`:

```ts
class ENSResolver {
    /* ... */

    handlesAsset = (asset: Asset) => asset === "ETH";

    resolveENSName = (to: string): Promise<string> => {
        /* ... */
    };

    send = async (
        to: string,
        value: BigNumber,
        asset: Asset,
        deferHandler: Handler
    ): PromiEvent<string> => {
        return deferHandler.send(await resolveENSName(to), value, asset);
    };
}
```

See the following handlers as references:

-   [BTC Handler](./src/handlers/BTC/BTCHandler.ts) (ZEC and BCH handlers are similar)
-   [ETH Handler](./src/handlers/ETH/ETHHandler.ts)
-   [ERC20 Handler](./src/handlers/ERC20/ERC20Handler.ts)
<hr />
</details>
