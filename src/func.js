export function safeFunc(fn) {
    return (...args) => {
        try {
            return [fn(...args), undefined];
        } catch (err) {
            return [undefined, err];
        }
    };
}
