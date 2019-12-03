import BigNumber from "bignumber.js";
import BN from "bn.js";

// Remove 0x prefix from a hex string
export const strip0x = (hex: string) => hex.substring(0, 2) === "0x" ? hex.slice(2) : hex;

// Add a 0x prefix to a hex value, converting to a string first
export const Ox = (hex: string | BN | BigNumber | Buffer) => {
    const hexString = typeof hex === "string" ? hex : BigNumber.isBigNumber(hex) ? hex.toString(16) : hex.toString("hex");
    return hexString.substring(0, 2) === "0x" ? hexString : `0x${hexString}`;
};

/**
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array/12646864#12646864
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};
