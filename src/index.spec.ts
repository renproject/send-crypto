import test, { ExecutionContext } from "ava";
import BigNumber from "bignumber.js";
import { config } from "dotenv";

import CryptoAccount from "./index";
import { sleep } from "./lib/retry";

const result = config({ path: ".env" });
if (result.error) {
    throw result.error;
};

const WAIT_FOR_CONFIRMATIONS = !!process.env.CI; // For BTC, ZEC & BCH

{ // Sending tokens
    const sendToken = async (t: ExecutionContext<unknown>, asset: string | { type: "ERC20", address: string }, decimals: number, network: string) => {
        const account = new CryptoAccount(process.env.PRIVATE_KEY || "", { network });
        const address = await account.address(asset);
        const balance = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber }));
        const balanceSats = (await account.balanceOfInSats<BigNumber>(asset, { bn: BigNumber }));
        t.is(balanceSats.div(new BigNumber(10).exponentiatedBy(decimals)).toFixed(), balance.toFixed());
        console.log(`[${asset}] address: ${address} (${balance.toFixed()} ${asset})`);

        const amount = "0.001"; // balance;
        console.log(`[${asset}] Sending ${amount} ${asset} to ${address}...`);
        const txP = account.send(address, amount, asset, { subtractFee: true });

        console.log(`[${asset}] Waiting for transaction hash...`);
        await new Promise((resolve, reject) => txP.on("transactionHash", hash => { console.log(`[${asset}] Got transaction hash: ${hash}`); resolve(hash); }).catch(reject))

        if (!WAIT_FOR_CONFIRMATIONS && (asset === "BTC" || asset === "ZEC" || asset === "BCH")) {
            await sleep(10 * 1000);
        } else {
            console.log(`[${asset}] Waiting for 1 confirmation...`);
            await new Promise((resolve, reject) => txP.on("confirmation", confirmations => { console.log(`[${asset}] Got confirmation: ${confirmations}`); if (confirmations > 0) { resolve(confirmations); } }).catch(reject))
        }

        await txP;

        if (asset === "BTC" || asset === "ZEC" || asset === "BCH") {
            const balanceAfter = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber }));
            const balanceAfterConfirmed = (await account.balanceOf<BigNumber>(asset, { bn: BigNumber, confirmations: 1 }));

            t.is(balanceAfter.minus(balanceAfterConfirmed).isPositive(), true);
            t.is(balance.minus(balanceAfter).toNumber(), 0.0001);
        }
        t.is(0, 0);
    }

    test("send BTC", sendToken, "BTC", 8, "testnet");
    test("send ZEC", sendToken, "ZEC", 8, "testnet");
    test("send BCH", sendToken, "BCH", 8, "testnet");
    test.failing("send ETH", sendToken, "ETH", 18, "kovan");
    test.failing("send ERC20", sendToken, { type: "ERC20", address: "0x1234" }, 18, "kovan");
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
