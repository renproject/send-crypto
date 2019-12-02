import test, { ExecutionContext } from "ava";
import BigNumber from "bignumber.js";
import { config } from "dotenv";

import CryptoAccount from "./index";
import { sleep } from "./lib/retry";

const result = config({ path: ".env" });
if (result.error) {
    throw result.error;
};

{ // Sending tokens
    const sendToken = async (t: ExecutionContext<unknown>, asset: string | { type: "ERC20", address: string }) => {
        const account = new CryptoAccount(process.env.PRIVATE_KEY || "", { network: "testnet" });
        const address = await account.address(asset);
        const balance = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber }));
        const balanceSats = (await account.balanceOfInSats<BigNumber>(asset, { bn: BigNumber }));
        t.is(balanceSats.div(new BigNumber(10).exponentiatedBy(8)).toFixed(), balance.toFixed());
        console.log(`[${asset}] address: ${address} (${balance.toFixed()} ${asset})`);

        console.log(`[${asset}] Sending balance ${asset} to ${address}...`);
        const txP = account.send(address, balance, asset, { subtractFee: true });

        console.log(`[${asset}] Waiting for transaction hash...`);
        await new Promise((resolve, reject) => txP.on("transactionHash", hash => { console.log(`Got transaction hash: ${hash}`); resolve(hash); }).catch(reject))

        // console.log(`Waiting for confirmation...`);
        // await new Promise((resolve, reject) => txP.on("confirmation", confirmations => { console.log(`Got confirmation: ${confirmations}`); if (confirmations > 0) { resolve(confirmations); } }).catch(reject))

        await txP;

        await sleep(10 * 1000);
        const balanceAfter = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber }))
        const balanceAfterConfirmed = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber, confirmations: 1 }))

        t.is(balanceAfter.minus(balanceAfterConfirmed).isPositive(), true);

        t.is(balance.minus(balanceAfter).toNumber(), 0.0001);
    }

    test("send BTC", sendToken, "BTC");
    test("send ZEC", sendToken, "ZEC");
    test("send BCH", sendToken, "BCH");
    test.failing("send ETH", sendToken, "ETH");
    test.failing("send ERC20", sendToken, { type: "ERC20", address: "0x1234" });
}

{ // Generating private key
    const generatePrivateKey = async (t: ExecutionContext<unknown>, asset: string | { type: "ERC20", address: string }) => {
        const privateKey = CryptoAccount.newPrivateKey();

        const account = new CryptoAccount(privateKey, { network: "testnet" });
        const address = await account.address(asset);
        const balance = await account.balanceOf<BigNumber>(asset, { bn: BigNumber });
        console.log(`[${asset}] address: ${address} (${balance.toFixed()} ${asset})`);
        t.is(0, 0);
    }

    test("generate private key for BTC", generatePrivateKey, "BTC");
    test("generate private key for ZEC", generatePrivateKey, "ZEC");
    test("generate private key for BCH", generatePrivateKey, "BCH");
    test.failing("generate private key for ETH", generatePrivateKey, "ETH");
    test.failing("generate private key for ERC20", generatePrivateKey, { type: "ERC20", address: "0x1234" });
}
