import test from "ava";
import BigNumber from "bignumber.js";
import { config } from "dotenv";

import CryptoAccount from "./index";

const result = config({ path: ".env" });
if (result.error) {
    throw result.error;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('send BTC', async t => {
    const account = new CryptoAccount(process.env.PRIVATE_KEY || "", { network: "testnet" });
    const address = await account.address("BTC");
    const balance = (await account.balanceOf<BigNumber>('BTC', { bn: BigNumber }));
    const balanceSats = (await account.balanceOfInSats<BigNumber>('BTC', { bn: BigNumber }));
    t.is(balanceSats.div(new BigNumber(10).exponentiatedBy(8)).toFixed(), balance.toFixed());
    console.log(`BTC address: ${address} (${balance.toFixed()} BTC)`);
    const tx = await account.send(address, 0.001, "BTC");
    console.log("tx: ", tx);
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
