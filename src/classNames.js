// Based on URL: https://github.com/JedWatson/classnames/blob/main/index.js
// eslint-disable-next-line sonarjs/cognitive-complexity
export function classNames(...args) {
    const classNames = [];
    for (const arg of args) {
        if (typeof arg === 'string') {
            classNames.push(arg);
            continue;
        }

        if (Object(arg) === arg) {
            for (const name in arg) {
                if (!Object.hasOwn(arg, name)) {
                    continue;
                }
                if (arg[name]) {
                    classNames.push(name);
                }
            }
        }
    }
    return classNames.join(' ');
}
