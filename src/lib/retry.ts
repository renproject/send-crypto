export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const extractError = (error: any): string => {
    if (typeof error === "object") {
        if (error.response && error.response.request && error.response.request.statusText) { return extractError(error.response.request.statusText); }
        if (error.response) { return extractError(error.response); }
        if (error.error) { return extractError(error.error); }
        if (error.message) { return extractError(error.message); }
        if (error.data) { return extractError(error.data); }
        if (error.statusText) { return extractError(error.statusText); }
        try {
            return JSON.stringify(error);
        } catch (error) {
            // Ignore JSON error
        }
    }
    return String(error);
};

export const fallback = async <T>(fallbacks: Array<() => Promise<T>>): Promise<T> => {
    let firstError: Error | undefined;
    for (const fn of fallbacks) {
        try {
            return await fn();
        } catch (error) {
            firstError = firstError || error;
        }
    }
    throw (firstError || new Error("No result returned"));
}

export const retryNTimes = async <T>(fnCall: () => Promise<T>, retries: number) => {
    let returnError;
    for (let i = 0; i < retries; i++) {
        // if (i > 0) {
        //     console.debug(`Retrying...`);
        // }
        try {
            return await fnCall();
        } catch (error) {
            if (String(error).match(/timeout of .* exceeded/)) {
                returnError = error;
            } else {
                const errorMessage = extractError(error);
                if (errorMessage) {
                    // tslint:disable-next-line: no-object-mutation
                    error.message += ` (${errorMessage})`;
                }
                throw error;
            }
        }
        await sleep(500);
    }
    throw returnError;
};