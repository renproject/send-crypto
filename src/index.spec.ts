import test from "ava";

import CryptoAccount from "./index";

test('power', async t => {
    const account = new CryptoAccount('0x1234');
    const balance = await account.balanceOf('BTC');

    t.is(balance.toString(), '0');
});
