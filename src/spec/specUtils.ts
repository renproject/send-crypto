import { ExecutionContext } from "ava";

// import { List } from "immutable";

export const testEndpoints = async (
    t: ExecutionContext<unknown>,
    endpoints: ReadonlyArray<undefined | (() => Promise<any>)>
) => {
    let expectedResult = null;
    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        if (!endpoint) {
            continue;
        }
        try {
            const result = await endpoint();
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
            if (error.message.match(/Request failed with status code 503/)) {
                continue;
            }
            throw error;
        }
    }
};
