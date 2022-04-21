import BigNumber from "bignumber.js";

import {
    Denom,
    LCDClient,
    MsgSend,
    RawKey,
    Wallet,
} from "@terra-money/terra.js";

import { newPromiEvent, PromiEvent } from "../../lib/promiEvent";
import { strip0x } from "../../lib/utils";
import { Asset, Handler } from "../../types/types";

export enum TerraNetwork {
    Bombay = "bombay-12",
    Columbus = "columbus-3",
}

interface ConstructorOptions {
    terra?: {
        URL: string;
    };
}
interface AddressOptions {}
interface BalanceOptions extends AddressOptions {
    address?: string;
}
interface TxOptions extends Partial<{}> {
    subtractFee?: boolean; // defaults to false
    memo?: string;
}

const toDenom = (asset: "LUNA") => "uluna";

export class TERRAHandler
    implements
        Handler<ConstructorOptions, AddressOptions, BalanceOptions, TxOptions>
{
    private readonly network: TerraNetwork;

    private readonly decimals = 6;

    public client: LCDClient;
    public wallet: Wallet;
    public key: RawKey;

    constructor(
        privateKey: string,
        network: string,
        options: ConstructorOptions = {},
        sharedState?: any
    ) {
        this.network =
            network === "mainnet" ? TerraNetwork.Columbus : TerraNetwork.Bombay;

        const client =
            sharedState.client ||
            new LCDClient({
                URL: options && options.terra ? options.terra.URL : "",
                chainID: this.network,
            });

        const key = new RawKey(Buffer.from(strip0x(privateKey), "hex"));

        const wallet = client.wallet(key);

        this.client = client;
        this.wallet = wallet;
        this.key = key;
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        typeof asset === "string" &&
        ["LUNA"].indexOf(asset.toUpperCase()) !== -1;

    public readonly address = (
        asset: Asset,
        _options: AddressOptions = {}
    ): string => {
        if (!this.handlesAsset(asset)) {
            throw new Error(`Asset ${asset} not supported.`);
        }

        return this.key.accAddress;
    };

    // Balance
    public readonly getBalance = async (
        asset: Asset,
        options: BalanceOptions = {}
    ): Promise<BigNumber> =>
        (await this.getBalanceInSats(asset, options)).dividedBy(
            new BigNumber(10).exponentiatedBy(this.decimals)
        );

    public readonly getBalanceInSats = async (
        asset: Asset,
        options: BalanceOptions = {}
    ): Promise<BigNumber> => {
        if (!this.handlesAsset(asset)) {
            throw new Error(`Asset ${asset} not supported.`);
        }

        const balances = (
            await this.client.bank.balance(
                (options && options.address) || (await this.address(asset))
            )
        )[0];
        const balance = balances.get(toDenom(asset as "LUNA"));

        return new BigNumber(balance ? balance.amount.toFixed() : 0);
    };

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
        value: BigNumber,
        asset: Asset,
        options: TxOptions = {}
    ): PromiEvent<string> => {
        const promiEvent = newPromiEvent<string>();

        (async () => {
            const address = await this.address(asset);

            const send = new MsgSend(address, to, { uluna: value.toFixed() });

            const signedTx = await this.wallet.createAndSignTx({
                msgs: [send],
                memo: options.memo,
            });

            const result = await this.client.tx.broadcast(signedTx);

            const txHash = result.txhash;

            promiEvent.emit("transactionHash", txHash);

            promiEvent.resolve(txHash);
        })().catch((error) => {
            promiEvent.reject(error);
        });

        return promiEvent;
    };
}
