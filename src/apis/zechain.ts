export const unused = 0;

// export const fetchFromZechain = async (url: string): Promise<ZcashUTXO[]> => {
//     // Mainnet ZEC only!
//     const resp = await retryNTimes(
//         () => Axios.get<Array<{
//             address: string; // "t1eUHMR2k3NjZBuxmveSfee71otew7RFdwt"
//             txid: string; // "3b144316b919d01105378c0f4e3b1d3914c04d6b1ca009dae800295f1cfb35a8"
//             vout: number; // 0
//             scriptPubKey: string; // "76a914e1f180bffadc561719c64c76b2fa3efacf955e0088ac"
//             amount: number; // 0.11912954
//             satoshis: number; // 11912954
//             height: number; // 573459
//             confirmations: number; // 4
//         }>>(url),
//         5,
//     );

//     return resp.data.map((utxo) => ({
//         txid: utxo.txid,
//         value: utxo.amount,
//         script_hex: utxo.scriptPubKey,
//         output_no: utxo.vout,
//     }));
// };
