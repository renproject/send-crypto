import BigNumber from "bignumber.js";
import BN from "bn.js";

// Remove 0x prefix from a hex string
export const strip0x = (hex: string) => hex.substring(0, 2) === "0x" ? hex.slice(2) : hex;

// Add a 0x prefix to a hex value, converting to a string first
export const Ox = (hex: string | BN | BigNumber | Buffer) => {
    const hexString = typeof hex === "string" ? hex : BigNumber.isBigNumber(hex) ? hex.toString(16) : hex.toString("hex");
    return hexString.substring(0, 2) === "0x" ? hexString : `0x${hexString}`;
};
