export function withResolvers() {
    /* eslint-disable sort-keys-fix/sort-keys-fix */
    const withResolvers = {
        resolve: undefined,
        reject: undefined,
        promise: undefined,
    };
    /* eslint-enable sort-keys-fix/sort-keys-fix */

    withResolvers.promise = new Promise((resolve, reject) => {
        withResolvers.resolve = resolve;
        withResolvers.reject = reject;
    });
    return withResolvers;
}
