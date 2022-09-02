# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.2.38 (2022-09-02)


### Features

* add electrumx api ([91211c3](https://github.com/renproject/send-crypto/commit/91211c35e262a27c1bdbbfdbf412035aebe1cb3c))
* add fetchUTXO ([e543cd2](https://github.com/renproject/send-crypto/commit/e543cd23bb5dbd89b60fbe084d469b46c2bc9b10))
* add handler for litecoin ([941f228](https://github.com/renproject/send-crypto/commit/941f228f73705e220de4415e76edd20cc1a6ce90))
* add litecoin support ([3915e22](https://github.com/renproject/send-crypto/commit/3915e22a0b03ddb028c8f897a2ff582ac0182360))
* added blockchain.com api, fix multichain endpoint ([ad95456](https://github.com/renproject/send-crypto/commit/ad9545668e3f2d7c32ff475b9dd58a36782e5afe))
* added doge getTransactions ([d2d8a09](https://github.com/renproject/send-crypto/commit/d2d8a09627f3e035f9fd92b29f28bf2d7815f7e2))
* added fetchTXs endpoints ([7582026](https://github.com/renproject/send-crypto/commit/75820269260fc5646a5318a179e8b70067907671))
* added FIL support ([83d56b5](https://github.com/renproject/send-crypto/commit/83d56b5a55267ca41655c0ceea6664da1a8b51ae))
* added getUTXO to wrap around fetchUTXO ([e146c94](https://github.com/renproject/send-crypto/commit/e146c94400a71308c34b0bdc4cd9dfcac9ca9930))
* added initial doge api support, updated dependencies ([34cb062](https://github.com/renproject/send-crypto/commit/34cb062a6601f0baf371d9cbb92efd574fd7c2f0))
* added jsonrpc api ([047624f](https://github.com/renproject/send-crypto/commit/047624f85377091ad8e28883a66474d36c7c1bc9))
* added terra/luna support ([bdad20c](https://github.com/renproject/send-crypto/commit/bdad20cae50ffffd57198ac0be5afbcfed204b97))
* export doge handler ([932c107](https://github.com/renproject/send-crypto/commit/932c10710ba754a70f654711d65b1df4fc53650b))
* **FIL:** default to testnet for unrecognized network ([19401fa](https://github.com/renproject/send-crypto/commit/19401fad0329eccb6be2c156dda6628e63fd6995))
* reduced retry amounts ([1804776](https://github.com/renproject/send-crypto/commit/18047764ed0fffc2165eb750cd7bacd6ccb66adc))
* replaced web3 with ethers ([4f18568](https://github.com/renproject/send-crypto/commit/4f185682df252f8a4c8c2ee32324e2734eff9532))
* update ethereum mainnet endpoint ([bde5eb4](https://github.com/renproject/send-crypto/commit/bde5eb4889db656cdde1af6827947bdfb4048489))
* update terra testnet, add ethereum public rpc endpoints ([28ee695](https://github.com/renproject/send-crypto/commit/28ee695a855ea675f2ea50861bb3d3872f56c3a6))
* update web3 to 1.5.0 ([7a32e10](https://github.com/renproject/send-crypto/commit/7a32e10fc61a58fa784158e29387436147333ee8))
* updated bitgo-utxo-lib to fix zcash, updated bch endpoint ([2cdec25](https://github.com/renproject/send-crypto/commit/2cdec25ce79010e7fe95d12a403fd44065ae100c))
* updated dependencies ([f483881](https://github.com/renproject/send-crypto/commit/f483881595ca9b0818852606564ca023e5d3d1b0))
* updated dependencies ([319d0c8](https://github.com/renproject/send-crypto/commit/319d0c851867537c332e4209ed8dfe24863e82b4))


### Bug Fixes

* add babel runtime for filecoin dependency ([84be61d](https://github.com/renproject/send-crypto/commit/84be61d1a78182c69bb95fee11997c9ede09bcc3))
* convert key to buffer before initializing fil wallet ([ac3029e](https://github.com/renproject/send-crypto/commit/ac3029e3d485c2392834f863c908d4461f3a8965))
* **FIL:** return balance correctly ([67c554d](https://github.com/renproject/send-crypto/commit/67c554d05eb57224055974f36bf094cf26f64097))
* fixed fetchTransactions calling fetchUTXos instead ([e09da7e](https://github.com/renproject/send-crypto/commit/e09da7e0af6435bea07581244ac6e90d51128095))
* remove bn.js imports ([71fa3f2](https://github.com/renproject/send-crypto/commit/71fa3f2d8a1a570ac76ce6889c21235209a3447c))
* use rimraf in clean command ([e168df3](https://github.com/renproject/send-crypto/commit/e168df37155f2fb314c2d154775d9789bd208a9a))

### [0.2.37](https://github.com/renproject/send-crypto/compare/v0.2.36...v0.2.37) (2022-04-21)


### Features

* update terra testnet, add ethereum public rpc endpoints ([28ee695](https://github.com/renproject/send-crypto/commit/28ee695a855ea675f2ea50861bb3d3872f56c3a6))

### [0.2.36](https://github.com/renproject/send-crypto/compare/v0.2.35...v0.2.36) (2022-03-31)


### Features

* update ethereum mainnet endpoint ([bde5eb4](https://github.com/renproject/send-crypto/commit/bde5eb4889db656cdde1af6827947bdfb4048489))
* updated dependencies ([f483881](https://github.com/renproject/send-crypto/commit/f483881595ca9b0818852606564ca023e5d3d1b0))

### [0.2.35](https://github.com/renproject/send-crypto/compare/v0.2.34...v0.2.35) (2022-03-02)


### Features

* replaced web3 with ethers ([4f18568](https://github.com/renproject/send-crypto/commit/4f185682df252f8a4c8c2ee32324e2734eff9532))

### [0.2.34](https://github.com/renproject/send-crypto/compare/v0.2.33...v0.2.34) (2022-03-02)


### Features

* added blockchain.com api, fix multichain endpoint ([ad95456](https://github.com/renproject/send-crypto/commit/ad9545668e3f2d7c32ff475b9dd58a36782e5afe))

### [0.2.33](https://github.com/renproject/send-crypto/compare/v0.2.32...v0.2.33) (2021-08-04)


### Bug Fixes

* convert key to buffer before initializing fil wallet ([ac3029e](https://github.com/renproject/send-crypto/commit/ac3029e3d485c2392834f863c908d4461f3a8965))

### [0.2.32](https://github.com/renproject/send-crypto/compare/v0.2.31...v0.2.32) (2021-08-04)


### Bug Fixes

* add babel runtime for filecoin dependency ([84be61d](https://github.com/renproject/send-crypto/commit/84be61d1a78182c69bb95fee11997c9ede09bcc3))

### [0.2.31](https://github.com/renproject/send-crypto/compare/v0.2.30...v0.2.31) (2021-08-04)


### Features

* update web3 to 1.5.0 ([7a32e10](https://github.com/renproject/send-crypto/commit/7a32e10fc61a58fa784158e29387436147333ee8))


### Bug Fixes

* use rimraf in clean command ([e168df3](https://github.com/renproject/send-crypto/commit/e168df37155f2fb314c2d154775d9789bd208a9a))

### [0.2.30](https://github.com/renproject/send-crypto/compare/v0.2.29...v0.2.30) (2021-08-04)


### Features

* add electrumx api ([91211c3](https://github.com/renproject/send-crypto/commit/91211c35e262a27c1bdbbfdbf412035aebe1cb3c))

### [0.2.29](https://github.com/renproject/send-crypto/compare/v0.2.28...v0.2.29) (2021-01-13)


### Features

* added jsonrpc api ([047624f](https://github.com/renproject/send-crypto/commit/047624f85377091ad8e28883a66474d36c7c1bc9))
* reduced retry amounts ([1804776](https://github.com/renproject/send-crypto/commit/18047764ed0fffc2165eb750cd7bacd6ccb66adc))

### [0.2.28](https://github.com/renproject/send-crypto/compare/v0.2.27...v0.2.28) (2020-12-15)


### Features

* added terra/luna support ([bdad20c](https://github.com/renproject/send-crypto/commit/bdad20cae50ffffd57198ac0be5afbcfed204b97))

### [0.2.27](https://github.com/renproject/send-crypto/compare/v0.2.26...v0.2.27) (2020-11-26)


### Features

* updated dependencies ([319d0c8](https://github.com/renproject/send-crypto/commit/319d0c851867537c332e4209ed8dfe24863e82b4))

### [0.2.26](https://github.com/renproject/send-crypto/compare/v0.2.25...v0.2.26) (2020-11-26)


### Features

* updated bitgo-utxo-lib to fix zcash, updated bch endpoint ([2cdec25](https://github.com/renproject/send-crypto/commit/2cdec25ce79010e7fe95d12a403fd44065ae100c))

### [0.2.25](https://github.com/renproject/send-crypto/compare/v0.2.24...v0.2.25) (2020-11-10)


### Bug Fixes

* **FIL:** return balance correctly ([67c554d](https://github.com/renproject/send-crypto/commit/67c554d05eb57224055974f36bf094cf26f64097))

### [0.2.24](https://github.com/renproject/send-crypto/compare/v0.2.23...v0.2.24) (2020-11-10)

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
