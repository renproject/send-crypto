import BigNumber from "bignumber.js";
import Web3 from "web3";
import { TransactionConfig } from "web3-core";

import { forwardEvents, newPromiEvent, PromiEvent } from "../lib/promiEvent";
import { Asset, Handler } from "../types/types";

interface ConstructorOptions { }
interface AddressOptions { }
interface BalanceOptions extends AddressOptions {
    address?: string;

    // Note that this acts differently to BTC/BCH/ZEC. This returns the balance
    // (confirmations - 1) blocks ago.
    confirmations?: number; // defaults to 0
}
interface TxOptions extends TransactionConfig {
    fee?: number;           // defaults to 10000
    // subtractFee?: boolean;  // defaults to false
}

const getWeb3 = (privateKey: string, endpoint: string): [Web3, string] => {
    const web3 = new Web3(endpoint);
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);
    // tslint:disable-next-line: no-object-mutation
    web3.eth.defaultAccount = account.address;
    return [web3, account.address];
};

// Free tier - only used as a fallback.
const defaultInfuraKey = "3b7a6c29f9c048d688a848899888aa96";

const getEndpoint = (network: string | undefined, ethereumNode: string | undefined, infuraKey: string | undefined) => {
    return ethereumNode ? ethereumNode : `https://${network}.infura.io/v3/${infuraKey || defaultInfuraKey}`;
}

enum Network {
    Mainnet = "mainnet",
    Ropsten = "ropsten",
    Kovan = "kovan",
    Rinkeby = "rinkeby",
    Görli = "goerli",
}

const getNetwork = (network: string): Network => {
    switch (network.toLowerCase()) {
        case "mainnet":
        case "main":
            return Network.Mainnet;

        case "kovan":
            return Network.Kovan;

        case "rinkeby":
            return Network.Rinkeby;

        case "görli":
        case "goerli":
        case "gorli":
            return Network.Görli;

        case "ropsten":
        case "testnet":
        default:
            return Network.Ropsten;
    }
}


export class ETHHandler implements Handler<ConstructorOptions, AddressOptions, BalanceOptions, TxOptions> {
    private readonly privateKey: string;
    private readonly network: string;

    private readonly decimals = 18;

    private readonly unlockedAddress: string;

    private readonly sharedState: {
        web3: Web3;
    };

    constructor(privateKey: string, network: string, options?: { infuraKey?: string, ethereumNode?: string }, sharedState?: any) {
        this.network = getNetwork(network);
        this.privateKey = privateKey;
        const [web3, address] = getWeb3(this.privateKey, getEndpoint(this.network, options && options.ethereumNode, options && options.infuraKey));
        this.unlockedAddress = address;
        sharedState.web3 = web3;
        this.sharedState = sharedState;
    }

    // Returns whether or not this can handle the asset
    public readonly handlesAsset = (asset: Asset): boolean =>
        ["ETH", "ETHER", "ETHEREUM"].indexOf(asset.toUpperCase()) !== -1;

    public readonly address = async (asset: Asset, options?: AddressOptions): Promise<string> =>
        this.unlockedAddress;

    // Balance
    public readonly balanceOf = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> =>
        (await this.balanceOfInSats(asset, options)).dividedBy(
            new BigNumber(10).exponentiatedBy(this.decimals)
        );

    public readonly balanceOfInSats = async (asset: Asset, options?: BalanceOptions): Promise<BigNumber> => {
        let atBlock;
        if (options && options.confirmations && options.confirmations > 0) {
            const currentBlock = new BigNumber(await this.sharedState.web3.eth.getBlockNumber());
            atBlock = currentBlock.minus(options.confirmations).plus(1).toNumber();
        }
        const address = options && options.address || await this.address(asset);
        return new BigNumber(await this.sharedState.web3.eth.getBalance(address, atBlock as any))
            .div(new BigNumber(10).pow(this.decimals));
    };

    // Transfer
    public readonly send = (
        to: string,
        value: BigNumber,
        asset: Asset,
        options?: TxOptions
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
        options?: TxOptions
    ): PromiEvent<string> => {

        const promiEvent = newPromiEvent<string>();

        (async () => {
            const web3PromiEvent = this.sharedState.web3.eth.sendTransaction({
                from: await this.address(asset),
                gas: 21000,
                ...options,
                to,
                value: valueIn.toString(),
            }) as unknown as PromiEvent<string>;
            forwardEvents(web3PromiEvent, promiEvent);
            web3PromiEvent.then(promiEvent.resolve);
        })().catch((error) => { promiEvent.reject(error) });

        return promiEvent;
    };
}
