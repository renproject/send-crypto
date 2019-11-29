import * as bitcoin from "bitgo-utxo-lib";

import BigNumber from "bignumber.js";

import { UTXO } from "../../lib/mercury";

const buildUTXO = async (
    network: typeof bitcoin.networks.bitcoin,
    privateKey: any, changeAddress: string, toAddress: string, valueIn: BigNumber, utxos: UTXO[],
    options?: { subtractFee?: boolean, fee?: number, signFlag?: number, version?: number, versionGroupID?: number }
): Promise<{ toHex: () => string }> => {
    const fees = new BigNumber(options && options.fee !== undefined ? options.fee : 10000);

    const value = options && options.subtractFee ? valueIn.minus(fees) : valueIn;

    const tx = new bitcoin.TransactionBuilder(network);
    if (options && options.version) {
        tx.setVersion(options.version);
    }
    if (options && options.versionGroupID) {
        tx.setVersionGroupId(options.versionGroupID);
    }

    // Only use the required utxos
    const [usedUTXOs, sum] = utxos.reduce(([utxoAcc, total], utxo) => total.lt(value.plus(fees)) ? [[...utxoAcc, utxo], total.plus(utxo.value)] : [utxoAcc, total], [[] as UTXO[], new BigNumber(0)])

    if (sum.lt(value.plus(fees))) {
        throw new Error("Insufficient balance to broadcast transaction");
    }

    // Add all inputs
    usedUTXOs.map(utxo => {
        tx.addInput(utxo.txid, utxo.output_no);
    });

    const change = sum.minus(value).minus(fees);

    // Add outputs
    tx.addOutput(toAddress, value.toNumber());
    if (change.gt(0)) { tx.addOutput(changeAddress, change.toNumber()); }

    // Sign inputs
    usedUTXOs.map((utxo, i) => {
        tx.sign(i, privateKey, "", options && options.signFlag !== undefined ? options.signFlag : null, utxo.value);
    });

    return tx.build();
}

const loadPrivateKey = (network: typeof bitcoin.networks.bitcoin, privateKey: string) => {
    return bitcoin.ECPair.fromPrivateKeyBuffer(Buffer.from(privateKey, "hex"), network);
}

export const BitgoUTXOLib = {
    buildUTXO,
    loadPrivateKey,
};
