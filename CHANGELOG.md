# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.14](https://github.com/renproject/send-crypto/compare/v0.2.13...v0.2.14) (2020-07-13)

### [0.2.13](https://github.com/renproject/send-crypto/compare/v0.2.12...v0.2.13) (2020-07-13)


### Features

* added getUTXO to wrap around fetchUTXO ([e146c94](https://github.com/renproject/send-crypto/commit/e146c94400a71308c34b0bdc4cd9dfcac9ca9930))

### [0.2.12](https://github.com/renproject/send-crypto/compare/v0.2.11...v0.2.12) (2020-07-13)


### Features

* add fetchUTXO ([e543cd2](https://github.com/renproject/send-crypto/commit/e543cd23bb5dbd89b60fbe084d469b46c2bc9b10))

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

* Added `approve` option for ERC20s

### [0.1.3](https://github.com/renproject/send-crypto/compare/v0.1.2...v0.1.3) (2019-12-03)

* Randomized API fallback order

### [0.1.2](https://github.com/renproject/send-crypto/compare/v0.1.1...v0.1.2) (2019-12-03)

* Renamed `balanceOf` to `getBalance`
* Exposed getUTXOs in BTC, ZEC and BCH handlers

### [0.1.1](https://github.com/renproject/send-crypto/compare/v0.1.0...v0.1.1) (2019-12-02)

* Allowed importing without `.default`

### 0.1.0 (2019-12-02)

First public release, supporting BTC, BCH, ZEC, ETH and ERC20s.
