import test from "ava";
import BigNumber from "bignumber.js";
import { config } from "dotenv";

import CryptoAccount from "./index";
import { sleep } from "./lib/retry";

const result = config({ path: ".env" });
if (result.error) {
    throw result.error;
};

test("send tokens", async t => {
    for (const asset of ["BTC", "ZEC"]) {
        const account = new CryptoAccount(process.env.PRIVATE_KEY || "", { network: "testnet" });
        const address = await account.address(asset);
        const balance = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber }));
        const balanceSats = (await account.balanceOfInSats<BigNumber>(asset, { bn: BigNumber }));
        t.is(balanceSats.div(new BigNumber(10).exponentiatedBy(8)).toFixed(), balance.toFixed());
        console.log(`${asset} address: ${address} (${balance.toFixed()} ${asset})`);

        console.log(`Sending balance ${asset} to ${address}...`);
        const txP = account.send(address, balance, asset, { subtractFee: true });

        console.log(`Waiting for transaction hash...`);
        await new Promise((resolve, reject) => txP.on("transactionHash", hash => { console.log(`Got transaction hash: ${hash}`); resolve(hash); }).catch(reject))

        console.log(`Waiting for confirmation...`);
        await new Promise((resolve, reject) => txP.on("confirmation", confirmations => { console.log(`Got confirmation: ${confirmations}`); if (confirmations > 0) { resolve(confirmations); } }).catch(reject))

        await txP;

        await sleep(10 * 1000);
        const balanceAfter = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber }))
        const balanceAfterConfirmed = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber, confirmations: 1 }))

        t.is(balanceAfter.minus(balanceAfterConfirmed).isPositive(), true);

        t.is(balance.minus(balanceAfter).toNumber(), 0.0001);
    }
});

test("generate private key", async t => {
    for (const asset of ["BTC", "ZEC"]) {
        const privateKey = CryptoAccount.newPrivateKey();

        const account = new CryptoAccount(privateKey, { network: "testnet" });
        const address = await account.address(asset);
        const balance = await account.balanceOf<BigNumber>(asset, { bn: BigNumber });
        console.log(`${asset} address: ${address} (${balance.toFixed()} ${asset})`);
        t.is(0, 0);
    }
});
