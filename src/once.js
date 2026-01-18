export default class Once {
    #done = false;
    #promise = undefined;

    do(fn) {
        validateFunction(fn);
        if (this.#done) {
            return;
        }
        this.#done = true;

        const res = fn();
        return res;
    }

    async doAsync(fn) {
        validateFunction(fn);
        if (this.#done && this.#promise === undefined) {
            return;
        }
        this.#done = true;

        if (this.#promise === undefined) {
            this.#promise = this.#runAsync(fn);
        }
        return this.#promise;
    }

    async #runAsync(fn) {
        try {
            const res = await fn();
            return res;
        } finally {
            this.#promise = undefined;
        }
    }
}

function validateFunction(fn) {
    if (typeof fn !== 'function') {
        throw new Error('Invalid "fn" argument, expected to be a function');
    }
}
