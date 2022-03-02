import { PromiEvent } from "./promiEvent";
import { sleep } from "./retry";

export const subscribeToConfirmations = <T>(
    promiEvent: PromiEvent<T>,
    cancelled: () => boolean,
    getConfirmations: () => Promise<number>
) => {
    let mutex;
    const watchForConfirmations = async () => {
        const lock = Symbol();
        mutex = lock;

        // Yield to task manager to let the event subscription finish
        await sleep(0);

        let confirmations = 0;
        while (!cancelled() && watchingConfirmations && mutex === lock) {
            try {
                const newConfirmations = await getConfirmations();
                if (newConfirmations > confirmations) {
                    confirmations = newConfirmations;
                    promiEvent.emit("confirmation", confirmations);
                }
            } catch (error: any) {
                console.error(error);
            }
            await sleep(5000);
        }
    };

    let watchingConfirmations = 0;
    promiEvent.on("newListener", (eventName) => {
        if (eventName === "confirmation") {
            watchingConfirmations++;
            if (watchingConfirmations === 1) {
                watchForConfirmations();
            }
        }
    });

    promiEvent.on("removeListener", (eventName) => {
        if (eventName === "confirmation") {
            watchingConfirmations--;
        }
    });
};
