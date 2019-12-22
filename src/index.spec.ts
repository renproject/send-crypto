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

const s = (asset: string | { type: "ERC20", name: string, address?: string }) => typeof asset === "string" ? asset : asset.name;

{ // Sending tokens
    const sendToken = async (t: ExecutionContext<unknown>, asset: string | { type: "ERC20", name: string, address?: string }, decimals: number, network: string) => {

        const account = new CryptoAccount(process.env.PRIVATE_KEY || "", { network });
        const address = await account.address(asset);

        const balance = (await account.getBalance<BigNumber>(asset, { bn: BigNumber }));
        const balanceSats = (await account.getBalanceInSats<BigNumber>(asset, { bn: BigNumber }));
        t.is(balanceSats.div(new BigNumber(10).exponentiatedBy(decimals)).toFixed(), balance.toFixed());
        console.log(`[${s(asset)}] address: ${address} (${balance.toFixed()} ${s(asset)})`);

        const amount = balance;
        console.log(`[${s(asset)}] Sending ${amount} ${s(asset)} to ${address}...`);
        const txP = account.send(address, amount, asset, { subtractFee: true });

        console.log(`[${s(asset)}] Waiting for transaction hash...`);
        await new Promise((resolve, reject) => txP.on("transactionHash", hash => { console.log(`[${s(asset)}] Got transaction hash: ${hash}`); resolve(hash); }).catch(reject))

        if (!WAIT_FOR_CONFIRMATIONS && (asset === "BTC" || asset === "ZEC" || asset === "BCH")) {
            await sleep(10 * 1000);
        } else {
            console.log(`[${s(asset)}] Waiting for 1 confirmation...`);
            await new Promise((resolve, reject) => txP.on("confirmation", confirmations => { console.log(`[${s(asset)}] Got confirmation: ${confirmations}`); if (confirmations > 0) { resolve(confirmations); } }).catch(reject))
        }

        await txP;

        if (asset === "BTC" || asset === "ZEC" || asset === "BCH") {
            const balanceAfter = (await account.getBalance<BigNumber>(asset, { bn: BigNumber }));
            const balanceAfterConfirmed = (await account.getBalance<BigNumber>(asset, { bn: BigNumber, confirmations: 1 }));

            t.is(balanceAfter.minus(balanceAfterConfirmed).isPositive(), true);
            t.is(balance.minus(balanceAfter).toNumber(), 0.0001);
        }
        t.is(0, 0);
    }

    test.skip("send BTC", sendToken, "BTC", 8, "testnet");
    test.skip("send ZEC", sendToken, "ZEC", 8, "testnet");
    test.skip("send BCH", sendToken, "BCH", 8, "testnet");
    test.skip("send ETH", sendToken, "ETH", 18, "kovan");
    test.serial.skip("send REN", sendToken, { type: "ERC20", name: "REN", address: "0x2cd647668494c1b15743ab283a0f980d90a87394" }, 18, "kovan");
    test.serial.skip("send DAI", sendToken, { type: "ERC20", name: "DAI", address: "0xc4375b7de8af5a38a93548eb8453a498222c4ff2" }, 18, "kovan");
}

{ // Generating private key
    const generatePrivateKey = async (t: ExecutionContext<unknown>, asset: string | { type: "ERC20", name: string, address?: string }, network: string) => {
        const privateKey = CryptoAccount.newPrivateKey();

        const account = new CryptoAccount(privateKey, { network });
        const address = await account.address(asset);
        const balance = await account.getBalance<BigNumber>(asset, { bn: BigNumber });
        console.log(`[${s(asset)}] address: ${address} (${balance.toFixed()} ${s(asset)})`);
        t.is(0, 0);
    }

    test.skip("generate private key for BTC", generatePrivateKey, "BTC", "mainnet");
    test.skip("generate private key for ZEC", generatePrivateKey, "ZEC", "mainnet");
    test.skip("generate private key for BCH", generatePrivateKey, "BCH", "mainnet");
    test.skip("generate private key for ETH", generatePrivateKey, "ETH", "mainnet");
    test.skip("generate private key for ERC20", generatePrivateKey, { type: "ERC20", name: "DAI" }, "mainnet");

    test.skip("generate private key for BTC (testnet)", generatePrivateKey, "BTC", "testnet");
    test.skip("generate private key for ZEC (testnet)", generatePrivateKey, "ZEC", "testnet");
    test.skip("generate private key for BCH (testnet)", generatePrivateKey, "BCH", "testnet");
    test.skip("generate private key for ETH (testnet)", generatePrivateKey, "ETH", "testnet");
    test.skip("generate private key for ERC20 (testnet)", generatePrivateKey, { type: "ERC20", name: "DAI", address: "0xc4375b7de8af5a38a93548eb8453a498222c4ff2" }, "kovan");
}
