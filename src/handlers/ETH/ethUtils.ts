import Web3 from "web3";
import { TransactionConfig } from "web3-core";

export const getWeb3 = (privateKey: string, endpoint: string): [Web3, string] => {
    // const provider = new HDWalletProvider(privateKey, endpoint);
    const web3 = new Web3(endpoint);
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);
    // tslint:disable-next-line: no-object-mutation
    web3.eth.defaultAccount = account.address;
    // return new Web3(provider as any);
    return [web3, account.address];
};

// Free tier - only used as a fallback.
const defaultInfuraKey = "3b7a6c29f9c048d688a848899888aa96";

export const getEndpoint = (network: string | undefined, ethereumNode: string | undefined, infuraKey: string | undefined) => {
    return ethereumNode ? ethereumNode : `https://${network}.infura.io/v3/${infuraKey || defaultInfuraKey}`;
}

export enum Network {
    Mainnet = "mainnet",
    Ropsten = "ropsten",
    Kovan = "kovan",
    Rinkeby = "rinkeby",
    Görli = "goerli",
}

export const getNetwork = (network: string): Network => {
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

export const getTransactionConfig = <T extends TransactionConfig>(options: T): TransactionConfig => {
    const txConfig: any = {};
    // tslint:disable: no-object-mutation
    if (options.from) { txConfig.from = options.from; }
    if (options.from) { txConfig.from = options.from; }
    // if (options.to) { txConfig.to = options.to; }
    if (options.gasPrice) { txConfig.gasPrice = options.gasPrice; }
    if (options.gas) { txConfig.gas = options.gas; }
    if (options.value) { txConfig.value = options.value; }
    if (options.data) { txConfig.data = options.data; }
    if (options.nonce) { txConfig.nonce = options.nonce; }
    // if (options.chainId) { txConfig.chainId = options.chainId; }
    // if (options.common) { txConfig.common = options.common; }
    // if (options.chain) { txConfig.chain = options.chain; }
    // if (options.hardfork) { txConfig.hardfork = options.hardfork; }
    return txConfig
}
