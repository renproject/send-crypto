# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.23](https://github.com/renproject/send-crypto/compare/v0.2.22...v0.2.23) (2020-11-10)


### Features

* **FIL:** default to testnet for unrecognized network ([19401fa](https://github.com/renproject/send-crypto/commit/19401fad0329eccb6be2c156dda6628e63fd6995))

### [0.2.22](https://github.com/renproject/send-crypto/compare/v0.2.21...v0.2.22) (2020-11-10)


### Features

* added FIL support ([83d56b5](https://github.com/renproject/send-crypto/commit/83d56b5a55267ca41655c0ceea6664da1a8b51ae))

### [0.2.21](https://github.com/renproject/send-crypto/compare/v0.2.20...v0.2.21) (2020-10-30)

### [0.2.20](https://github.com/renproject/send-crypto/compare/v0.2.19...v0.2.20) (2020-10-07)


### Features

* added doge getTransactions ([d2d8a09](https://github.com/renproject/send-crypto/commit/d2d8a09627f3e035f9fd92b29f28bf2d7815f7e2))
* export doge handler ([932c107](https://github.com/renproject/send-crypto/commit/932c10710ba754a70f654711d65b1df4fc53650b))

### [0.2.19](https://github.com/renproject/send-crypto/compare/v0.2.18...v0.2.19) (2020-09-25)

### Bug Fixes

-   fixed fetchTXs calling fetchUTXos instead ([e09da7e](https://github.com/renproject/send-crypto/commit/e09da7e0af6435bea07581244ac6e90d51128095))

### [0.2.18](https://github.com/renproject/send-crypto/compare/v0.2.17...v0.2.18) (2020-09-25)

### [0.2.17](https://github.com/renproject/send-crypto/compare/v0.2.16...v0.2.17) (2020-09-25)

### Features

-   added fetchTXs endpoints ([7582026](https://github.com/renproject/send-crypto/commit/75820269260fc5646a5318a179e8b70067907671))

### [0.2.16](https://github.com/renproject/send-crypto/compare/v0.2.15...v0.2.16) (2020-09-18)

### Features

-   added initial doge api support, updated dependencies ([34cb062](https://github.com/renproject/send-crypto/commit/34cb062a6601f0baf371d9cbb92efd574fd7c2f0))

### [0.2.15](https://github.com/renproject/send-crypto/compare/v0.2.14...v0.2.15) (2020-09-09)

### Bug Fixes

-   remove bn.js imports ([71fa3f2](https://github.com/renproject/send-crypto/commit/71fa3f2d8a1a570ac76ce6889c21235209a3447c))

### [0.2.14](https://github.com/renproject/send-crypto/compare/v0.2.13...v0.2.14) (2020-07-13)

### [0.2.13](https://github.com/renproject/send-crypto/compare/v0.2.12...v0.2.13) (2020-07-13)

### Features

-   added getUTXO to wrap around fetchUTXO ([e146c94](https://github.com/renproject/send-crypto/commit/e146c94400a71308c34b0bdc4cd9dfcac9ca9930))

### [0.2.12](https://github.com/renproject/send-crypto/compare/v0.2.11...v0.2.12) (2020-07-13)

### Features

-   add fetchUTXO ([e543cd2](https://github.com/renproject/send-crypto/commit/e543cd23bb5dbd89b60fbe084d469b46c2bc9b10))

### [0.2.11](https://github.com/renproject/send-crypto/compare/v0.2.10...v0.2.11) (2020-06-26)

### [0.2.10](https://github.com/renproject/send-crypto/compare/v0.2.9...v0.2.10) (2020-06-11)

### [0.2.9](https://github.com/renproject/send-crypto/compare/v0.2.8...v0.2.9) (2020-06-11)

### [0.2.8](https://github.com/renproject/send-crypto/compare/v0.2.7...v0.2.8) (2020-06-11)

### [0.2.7](https://github.com/renproject/send-crypto/compare/v0.2.6...v0.2.7) (2020-06-11)

### [0.2.6](https://github.com/renproject/send-crypto/compare/v0.2.5...v0.2.6) (2020-06-11)

### [0.2.5](https://github.com/renproject/send-crypto/compare/v0.2.4...v0.2.5) (2020-06-11)

### [0.2.4](https://github.com/renproject/send-crypto/compare/v0.2.3...v0.2.4) (2020-06-11)

### [0.2.3](https://github.com/renproject/send-crypto/compare/v0.2.2...v0.2.3) (2020-04-29)

### [0.2.2](https://github.com/renproject/send-crypto/compare/v0.2.1...v0.2.2) (2020-04-10)

### [0.2.1](https://github.com/renproject/send-crypto/compare/v0.2.0...v0.2.1) (2020-04-10)

## [0.2.0](https://github.com/renproject/send-crypto/compare/v0.1.14...v0.2.0) (2020-04-09)

The UTXO type has been changed from

```ts
interface SoChainUTXO {
    txid: string;
    value: number;
    output_no: number;
    confirmations: number;
    script_hex?: string;
}
```

to

```ts
interface UTXO {
    txHash: string;
    vOut: number;
    amount: number;
    confirmations: number;
    scriptPubKey?: string;
}
```

### [0.1.14](https://github.com/renproject/send-crypto/compare/v0.1.13...v0.1.14) (2020-04-02)

### [0.1.13](https://github.com/renproject/send-crypto/compare/v0.1.12...v0.1.13) (2020-04-02)

### [0.1.12](https://github.com/renproject/send-crypto/compare/v0.1.11...v0.1.12) (2020-03-05)

### [0.1.11](https://github.com/renproject/send-crypto/compare/v0.1.10...v0.1.11) (2020-01-09)

### [0.1.10](https://github.com/renproject/send-crypto/compare/v0.1.9...v0.1.10) (2020-01-08)

### [0.1.9](https://github.com/renproject/send-crypto/compare/v0.1.8...v0.1.9) (2019-12-23)

### [0.1.8](https://github.com/renproject/send-crypto/compare/v0.1.7...v0.1.8) (2019-12-23)

### [0.1.7](https://github.com/renproject/send-crypto/compare/v0.1.6...v0.1.7) (2019-12-23)

### [0.1.6](https://github.com/renproject/send-crypto/compare/v0.1.5...v0.1.6) (2019-12-23)

### [0.1.5](https://github.com/renproject/send-crypto/compare/v0.1.4...v0.1.5) (2019-12-09)

### [0.1.4](https://github.com/renproject/send-crypto/compare/v0.1.3...v0.1.4) (2019-12-05)

-   Added `approve` option for ERC20s

### [0.1.3](https://github.com/renproject/send-crypto/compare/v0.1.2...v0.1.3) (2019-12-03)

-   Randomized API fallback order

### [0.1.2](https://github.com/renproject/send-crypto/compare/v0.1.1...v0.1.2) (2019-12-03)

-   Renamed `balanceOf` to `getBalance`
-   Exposed getUTXOs in BTC, ZEC and BCH handlers

### [0.1.1](https://github.com/renproject/send-crypto/compare/v0.1.0...v0.1.1) (2019-12-02)

-   Allowed importing without `.default`

### 0.1.0 (2019-12-02)

First public release, supporting BTC, BCH, ZEC, ETH and ERC20s.
