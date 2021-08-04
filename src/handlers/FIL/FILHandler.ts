import BigNumber from "bignumber.js";
import { Message, MessageObj } from "@glif/filecoin-message";
import Filecoin from "@glif/filecoin-wallet-provider";
import { Network as FilNetwork } from "@glif/filecoin-address";

import { newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { sleep } from "../../lib/retry";
import { Asset, Handler } from "../../types/types";
import { SingleKeyProvider } from "./provider";

interface ConstructorOptions {
    apiAddress?: string;
    token?: string;
}
interface AddressOptions {}
interface BalanceOptions extends AddressOptions {
    address?: string;
}
interface TxOptions extends Partial<MessageObj> {
    subtractFee?: boolean; // defaults to false
}

export class FILHandler
    implements
        Handler<ConstructorOptions, AddressOptions, BalanceOptions, TxOptions>
{
    private readonly network: FilNetwork;

    private readonly decimals = 18;

    private readonly sharedState: {
        filecoin: Filecoin;
    };

    constructor(
        privateKey: string,
        network: string,
        options: ConstructorOptions = {},
        sharedState?: any
    ) {
        const filecoin = new Filecoin(
            SingleKeyProvider(Buffer.from(privateKey, "hex")),
            {
                apiAddress: options && options.apiAddress,
                token: options && options.token,
            }
        );

        this.network =
            network === "mainnet" ? FilNetwork.MAIN : FilNetwork.TEST;

        sharedState.filecoin = filecoin;
        this.sharedState = sharedState;
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        typeof asset === "string" &&
        ["FIL", "FILECOIN"].indexOf(asset.toUpperCase()) !== -1;

    public readonly address = async (
        asset: Asset,
        _options: AddressOptions = {}
    ): Promise<string> => {
        if (!this.handlesAsset(asset)) {
            throw new Error(`Asset ${asset} not supported.`);
        }

        const accounts = await this.sharedState.filecoin.wallet.getAccounts(
            0,
            1,
            this.network
        );
        return accounts[0];
    };

    // Balance
    public readonly getBalance = async (
        asset: Asset,
        options: BalanceOptions = {}
    ): Promise<BigNumber> =>
        new BigNumber(
            await this.sharedState.filecoin.getBalance(
                (options && options.address) || (await this.address(asset))
            )
        );

    public readonly getBalanceInSats = async (
        asset: Asset,
        options: BalanceOptions = {}
    ): Promise<BigNumber> =>
        (await this.getBalance(asset, options)).multipliedBy(
            new BigNumber(10).exponentiatedBy(this.decimals)
        );

    // Transfer
    public readonly send = (
        to: string,
        value: BigNumber,
        asset: Asset,
        options: TxOptions = {}
    ): PromiEvent<string> =>
        this.sendSats(
            to,
            value.times(new BigNumber(10).exponentiatedBy(this.decimals)),
            asset,
            options
        );

    public readonly sendSats = (
        to: string,
        valueIn: BigNumber,
        asset: Asset,
        options: TxOptions = {}
    ): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>();

        (async () => {
            const address = await this.address(asset);
            const nonce = await this.sharedState.filecoin.getNonce(address);

            let value = valueIn;

            let message = new Message({
                to,
                from: address,
                value: valueIn,
                method: 0,
                gasFeeCap: 0,
                gasLimit: 0,
                gasPremium: 0,
                nonce,
                params: undefined,
                ...options,
            });

            message = await this.sharedState.filecoin.gasEstimateMessageGas(
                message.toLotusType()
            );

            if (options.subtractFee) {
                const { maxFee: fee } =
                    await this.sharedState.filecoin.gasEstimateMaxFee(
                        message.toLotusType()
                    );

                if (fee.gt(value)) {
                    throw new Error(
                        `Unable to include fee in value, fee exceeds value (${fee.toFixed()} > ${value.toFixed()})`
                    );
                }
                value = value.minus(fee);
            }

            const signed = await this.sharedState.filecoin.wallet.sign(
                address,
                message.toLotusType()
            );

            const tx = await this.sharedState.filecoin.sendMessage(
                signed.Message,
                signed.Signature.Data
            );

            const txHash = tx["/"];

            promiEvent.emit("transactionHash", txHash);

            while (true) {
                const result =
                    await this.sharedState.filecoin.jsonRpcEngine.request(
                        "StateSearchMsg",
                        tx
                    );

                /*
                {
                    Message: {
                        '/': 'bafy2bzacedtcalpfb5dj3de6jb5lfncqtxw4kia4xotpg3on3p7gcesiwlube'
                    },
                    Receipt: { ExitCode: 0, Return: null, GasUsed: 433268 },
                    ReturnDec: null,
                    TipSet: [
                        {
                        '/': 'bafy2bzacedsqymqnjl2oir7q2rgbwyqscihvebkvr7hfzdq5b2tvcct3cwczy'
                        },
                        {
                        '/': 'bafy2bzacednrjqbsyooob3f76wwct4iupauehvq6wnzrbf6uc4dskptwu4er6'
                        },
                        {
                        '/': 'bafy2bzaceany2in5cadbyf27mecnmzc6ustqfewd5dobxquidzbn3wtnjd52y'
                        }
                    ],
                    Height: 53025
                }
                */

                if (result) {
                    promiEvent.emit("confirmation", 1);
                    break;
                }

                await sleep(10 * 1000);
            }

            promiEvent.resolve(txHash);
        })().catch((error) => {
            promiEvent.reject(error);
        });

        return promiEvent;
    };
}
