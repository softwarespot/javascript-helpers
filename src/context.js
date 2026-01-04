// helpers

function createAbortContext(parentSignal) {
    const controller = new AbortController();
    const { signal } = controller;

    if (parentSignal) {
        if (parentSignal.aborted) controller.abort(parentSignal.reason);
        else
            parentSignal.addEventListener('abort', () => controller.abort(parentSignal.reason), {
                once: true,
            });
    }

    return { controller, signal };
}

export class Context {
    // private fields
    #signal = null;
    #deadline = null; // Date or number (ms timestamp)
    #values = {};

    constructor({ deadline = null, signal = null, values = {} } = {}) {
        this.#signal = signal;
        this.#deadline = deadline;
        this.#values = values;
    }

    static background() {
        return new Context();
    }

    static TODO() {
        return new Context();
    }

    // derive with cancellation (like context.WithCancel)
    withCancel() {
        const { controller, signal } = createAbortContext(this.#signal);
        const ctx = new Context({
            deadline: this.#deadline,
            signal,
            values: this.#values,
        });
        return { cancel: (reason) => controller.abort(reason), ctx };
    }

    // derive with timeout in ms (like context.WithTimeout)
    withTimeout(ms) {
        const deadline = Date.now() + ms;
        const { controller, signal } = createAbortContext(this.#signal);

        const timeoutId = setTimeout(() => {
            controller.abort(new Error('context deadline exceeded'));
        }, ms);

        signal.addEventListener(
            'abort',
            () => {
                clearTimeout(timeoutId);
            },
            { once: true },
        );

        const ctx = new Context({
            deadline,
            signal,
            values: this.#values,
        });

        return { cancel: (reason) => controller.abort(reason), ctx };
    }

    // derive with explicit deadline Date
    withDeadline(date) {
        const ms = date.getTime() - Date.now();
        return this.withTimeout(ms);
    }

    // derive with extra value (like context.WithValue)
    withValue(key, value) {
        return new Context({
            deadline: this.#deadline,
            signal: this.#signal,
            values: {
                ...this.#values,
                [key]: value,
            },
        });
    }

    value(key) {
        return this.#values[key];
    }

    isCancelled() {
        return this.#signal?.aborted === true;
    }

    reason() {
        return this.#signal?.reason;
    }
}
