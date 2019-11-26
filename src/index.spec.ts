import test from "ava";
import BigNumber from "bignumber.js";
import { config } from "dotenv";
import { EventEmitter } from "events";

import CryptoAccount from "./index";
import { sleep } from "./lib/retry";

const result = config({ path: ".env" });
if (result.error) {
    throw result.error;
};

test('send BTC', async t => {
    const account = new CryptoAccount(process.env.PRIVATE_KEY || "", { network: "testnet" });
    const address = await account.address("BTC");
    const balance = (await account.balanceOf<BigNumber>('BTC', { bn: BigNumber }));
    const balanceSats = (await account.balanceOfInSats<BigNumber>('BTC', { bn: BigNumber }));
    t.is(balanceSats.div(new BigNumber(10).exponentiatedBy(8)).toFixed(), balance.toFixed());
    console.log(`BTC address: ${address} (${balance.toFixed()} BTC)`);
    const txP = account.send(address, 0.001, "BTC");
    await new Promise((resolve, reject) => txP.on("transactionHash", hash => { console.log(`Got hash!!! ${hash}`); resolve(hash); }).catch(reject))
    // await new Promise((resolve, reject) => txP.on("confirmation", confirmations => { console.log(`Got confirmation!!! ${confirmations}`); if (confirmations > 0) { resolve(confirmations); } }).catch(reject))
    const tx = await txP;
    await sleep(10 * 1000);
    const balanceAfter = (await account.balanceOf<BigNumber>('BTC', { bn: BigNumber }))
    const balanceAfterConfirmed = (await account.balanceOf<BigNumber>('BTC', { bn: BigNumber, confirmations: 1 }))

    t.is(balanceAfter.minus(balanceAfterConfirmed).isPositive(), true);

    t.is(balance.minus(balanceAfter).toNumber(), 0.0001);
});

test('generate private key', async t => {
    const privateKey = CryptoAccount.newPrivateKey();

    const account = new CryptoAccount(privateKey, { network: "testnet" });
    const address = await account.address("BTC");
    const balance = await account.balanceOf<BigNumber>('BTC', { bn: BigNumber });
    console.log(`BTC address: ${address} (${balance.toFixed()} BTC)`);
    t.is(0, 0);
});
