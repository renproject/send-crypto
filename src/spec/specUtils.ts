import { ExecutionContext } from "ava";

import { extractError } from "../lib/retry";

// import { List } from "immutable";

export const testEndpoints = async (
    t: ExecutionContext<unknown>,
    endpoints: ReadonlyArray<undefined | (() => Promise<any>)>,
    expectedError?: RegExp
) => {
    let expectedResult = null;
    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        if (!endpoint) {
            continue;
        }
        try {
            const result = await endpoint();
            // console.log("result", result);
            // try {
            //     if (Array.isArray(result)) {
            //         result = List(result).sortBy(x => x.txid).toArray();
            //     }
            // } catch (error) {
            //     // ignore error
            // }
            expectedResult = expectedResult || result;
            t.deepEqual(
                result,
                expectedResult,
                `Comparison failed for endpoint #${i}`
            );
        } catch (error) {
            // tslint:disable-next-line: no-object-mutation
            error.message = extractError(error);
            if (
                expectedError &&
                // Check if error message matches expected error
                ((error.message && error.message.match(expectedError)) ||
                    // Check if request URL matches expected error
                    (error.response &&
                        error.config &&
                        typeof error.response.config.url === "string" &&
                        error.response.config.url.match(expectedError)))
            ) {
                continue;
            }
            console.log(
                "error.response.data",
                error.response && error.response.data
            );
            // if (error.message.match(/Request failed with status code 503/)) {
            //     continue;
            // }
            throw error;
        }
    }
};
