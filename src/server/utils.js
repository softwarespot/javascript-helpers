export function log(msg) {
    const dt = new Date();
    const dateParts = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()];
    const timeParts = [dt.getHours(), dt.getMinutes(), dt.getSeconds()];

    const padNum = (num) => (num < 10 ? `0${num}` : String(num));
    console.log(`${dateParts.map(padNum).join('-')} ${timeParts.map(padNum).join(':')}: ${msg}`);
}

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
