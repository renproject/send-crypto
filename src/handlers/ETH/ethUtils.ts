import { ethers, Overrides, PopulatedTransaction } from "ethers";

export const getEthersSigner = (
    privateKey: string,
    endpoint: string
): [ethers.Signer, string] => {
    // const provider = new HDWalletProvider(privateKey, endpoint);

    const provider = new ethers.providers.JsonRpcProvider(endpoint);
    const signer = new ethers.Wallet(privateKey, provider);
    return [signer, signer.address];
};

// Free tier - only used as a fallback.
const defaultInfuraKey = "3b7a6c29f9c048d688a848899888aa96";

export const getEndpoint = (
    network: string | undefined,
    ethereumNode: string | undefined,
    infuraKey: string | undefined
) => {
    return ethereumNode
        ? ethereumNode
        : infuraKey || network !== "mainnet"
        ? `https://${network}.infura.io/v3/${infuraKey || defaultInfuraKey}`
        : "https://cloudflare-eth.com";
};

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
};

// Create a `txConfig` object with only the relevant fields in the `options`
// object.
export const getTransactionConfig = <T extends Overrides>(
    options: T
): Overrides => {
    const txConfig: any = {};

    // tslint:disable: no-object-mutation

    if (options.gasLimit) {
        txConfig.gasLimit = options.gasLimit;
    }
    if (options.gasPrice) {
        txConfig.gasPrice = options.gasPrice;
    }
    if (options.maxFeePerGas) {
        txConfig.maxFeePerGas = options.maxFeePerGas;
    }
    if (options.maxPriorityFeePerGas) {
        txConfig.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
    }
    if (options.nonce) {
        txConfig.nonce = options.nonce;
    }
    if (options.type) {
        txConfig.type = options.type;
    }
    if (options.accessList) {
        txConfig.accessList = options.accessList;
    }
    if (options.customData) {
        txConfig.customData = options.customData;
    }

    return txConfig;
};
