export function safeFunc(fn) {
    return (...args) => {
        try {
            const res = fn(...args);
            return [res, undefined];
        } catch (err) {
            return [undefined, err];
        }
    };
}

export function safeFuncAsync(fn) {
    return async (...args) => {
        try {
            const res = await fn(...args);
            return [res, undefined];
        } catch (err) {
            return [undefined, err];
        }
    };
}
