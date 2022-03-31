// tslint:disable no-submodule-imports
import filecoin_signer from "@zondax/filecoin-signing-tools/js";
import { WalletSubProvider } from "@glif/filecoin-wallet-provider";
import { Network as FilNetwork } from "@glif/filecoin-address";
import { LotusMessage, SignedLotusMessage } from "@glif/filecoin-message";

export const SingleKeyProvider = (
    privateKey: Uint8Array
): WalletSubProvider => {
    // here we close over the private variables, so they aren't accessible to the outside world
    const PRIVATE_KEY = privateKey;
    const { private_hexstring } = filecoin_signer.keyRecover(PRIVATE_KEY);
    return {
        getAccounts: async (
            _nStart: number,
            _nEnd: number,
            network: string = FilNetwork.MAIN
        ) => {
            return [
                filecoin_signer.keyRecover(
                    PRIVATE_KEY,
                    network === FilNetwork.TEST
                ).address,
            ];
        },

        sign: async (
            _from: string,
            filecoinMessage: LotusMessage
        ): Promise<SignedLotusMessage> => {
            const { signature } = filecoin_signer.transactionSign(
                {
                    to: filecoinMessage.To,
                    from: filecoinMessage.From,
                    nonce: filecoinMessage.Nonce,
                    value: filecoinMessage.Value,
                    gaslimit: filecoinMessage.GasLimit,
                    gasfeecap: filecoinMessage.GasFeeCap,
                    gaspremium: filecoinMessage.GasPremium,
                    method: filecoinMessage.Method,
                    params: filecoinMessage.Params || "",
                },
                Buffer.from(private_hexstring, "hex").toString("base64")
            );
            return {
                Message: filecoinMessage,
                Signature: {
                    Type: 0,
                    Data: signature.data,
                },
            };
        },
    };
};
