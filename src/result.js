export default class Result {
    // Creates an OK Result
    static ok(value) {
        return new Result(value, undefined);
    }

    // Creates an error Result
    static err(error) {
        return new Result(undefined, error);
    }

    // Creates a Result from a function that may throw
    static from(fn, ...args) {
        try {
            const value = fn(...args);
            return this.ok(value);
        } catch (err) {
            return this.err(err);
        }
    }

    // Async version of from()
    static async fromAsync(fn, ...args) {
        try {
            const value = await fn(...args);
            return this.ok(value);
        } catch (err) {
            return this.err(err);
        }
    }

    #value = undefined;
    #error = undefined;

    constructor(value, error) {
        if (error !== undefined && value !== undefined) {
            throw new Error('Result cannot have both value and error defined');
        }

        this.#value = value;
        this.#error = error;

        Object.freeze(this);
    }

    // True when the result is OK i.e. error is undefined
    get ok() {
        return this.#error === undefined;
    }

    // True when the result is an error i.e. error is defined
    get err() {
        return this.#error !== undefined;
    }

    // Return the value
    get value() {
        return this.#value;
    }

    // Returns the error
    get error() {
        return this.#error;
    }

    // Calls ok(value) or err(error) depending on the Result state.
    // Handlers is an object with "ok" and/or "err" functions.
    // Throws if handlers is not an object with at least one function
    match(handlers) {
        if (!isObject(handlers)) {
            throw new Error('match requires an object with at least one function');
        }

        const { err: errFn, ok: okFn } = handlers;
        if (!isFunction(okFn) && !isFunction(errFn)) {
            throw new Error('match requires at least one function');
        }
        return this.ok ? okFn?.(this.#value) : errFn?.(this.#error);
    }

    // Returns the value when OK; otherwise, throws the error
    unwrap() {
        if (this.err) {
            throw this.#error;
        }
        return this.#value;
    }

    // Returns the value when OK; otherwise, returns the provided default value
    unwrapOr(defaultValue) {
        return this.ok ? this.#value : defaultValue;
    }

    // Returns the value when OK; otherwise, calls `fn(error)` and returns its result.
    // Throws if fn is not a function
    unwrapOrElse(fn) {
        if (!isFunction(fn)) {
            throw new Error('unwrapOrElse requires a function');
        }
        return this.ok ? this.#value : fn(this.#error);
    }

    // Maps an OK value using fn(value); otherwise, returns the error Result.
    // Throws if fn is not a function
    map(fn) {
        if (!isFunction(fn)) {
            throw new Error('map requires a function');
        }
        return this.ok ? Result.ok(fn(this.#value)) : Result.err(this.#error);
    }

    // Maps an error value using fn(error); otherwise, returns the OK Result.
    // Throws if fn is not a function
    mapErr(fn) {
        if (!isFunction(fn)) {
            throw new Error('mapErr requires a function');
        }
        return this.ok ? this : Result.err(fn(this.#error));
    }

    toPromise() {
        if (this.ok) {
            return Promise.resolve(this.#value);
        }
        return Promise.reject(this.#error);
    }

    toJSON() {
        if (this.ok) {
            return {
                ok: true,
                value: this.#value,
            };
        }

        const err = this.#error;
        if (isError(err)) {
            /* eslint-disable sort-keys-fix/sort-keys-fix */
            return {
                ok: false,
                error: {
                    name: err.name,
                    message: err.message,
                },
            };
            /* eslint-enable sort-keys-fix/sort-keys-fix */
        }

        /* eslint-disable sort-keys-fix/sort-keys-fix */
        return {
            ok: false,
            error: String(err),
        };
        /* eslint-enable sort-keys-fix/sort-keys-fix */
    }

    toString() {
        if (this.ok) {
            return `Result { ok: true, value: ${this.#value} }`;
        }
        return `Result { ok: false, error: ${this.#error} }`;
    }
}

function isError(obj) {
    return obj instanceof Error;
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
