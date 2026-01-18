/* eslint-disable sonarjs/cognitive-complexity */

export function safeJSONParse(str, defaultValue = undefined) {
    try {
        return JSON.parse(str);
    } catch {
        // Ignore error
        return defaultValue;
    }
}

export function safeJSONStringify(obj) {
    const seen = new WeakSet();

    return JSON.stringify(obj, (_, value) => {
        if (isInstanceOf(value, Date)) {
            return value.toISOString();
        }
        if (isInstanceOf(value, Error)) {
            return {
                dataType: 'Error',
                message: value.message,
                name: value.name,
                stack: value.stack,
            };
        }
        if (isInstanceOf(value, HTMLElement)) {
            return value.outerHTML;
        }
        if (isInstanceOf(value, Map)) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()),
            };
        }
        if (isInstanceOf(value, RegExp)) {
            return value.toString();
        }
        if (isInstanceOf(value, Set)) {
            return {
                dataType: 'Set',
                value: Array.from(value.values()),
            };
        }
        if (isInstanceOf(value, WeakMap)) {
            return '[WeakMap]';
        }
        if (isInstanceOf(value, WeakSet)) {
            return '[WeakSet]';
        }

        if (value === Infinity) {
            return 'Infinity';
        }
        if (value === -Infinity) {
            return '-Infinity';
        }
        if (Number.isNaN(value)) {
            return 'NaN';
        }
        if (isBigInt(value)) {
            return `${value.toString()}n`;
        }

        if (isSymbol(value)) {
            return value.toString();
        }

        if (isFunction(value)) {
            return value.toString();
        }

        if (isObject(value)) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    });
}

export class FlattenedJSON {
    #flattened = [];

    static flattenKeys(keys) {
        return flattenKeys(keys);
    }

    static resolveKeys(obj, keys) {
        return resolveFlattenedKeys(obj, keys);
    }

    constructor(obj, depth = Infinity) {
        this.#flattened = flatten(obj, depth);
    }

    *[Symbol.iterator]() {
        for (const [keys, value] of this.#flattened) {
            yield [flattenKeys(keys), value];
        }
    }

    *keys() {
        for (const [keys] of this.#flattened) {
            yield keys;
        }
    }

    *values() {
        for (const [, value] of this.#flattened) {
            yield value;
        }
    }

    *entries() {
        yield* this.#flattened;
    }
}

function flatten(obj, depth = Infinity, seen = new WeakSet()) {
    // Return primitive values as-is
    if (!isObject(obj) || depth <= 0) {
        return [[[], obj]];
    }

    // Check for circular references
    if (seen.has(obj)) {
        return [[['[Circular]'], '[Circular]']];
    }

    // Add the current object to the set of seen objects
    seen.add(obj);

    const flattened = [];
    for (const [value, keyOrIndex] of iterator(obj)) {
        if (!isObject(value)) {
            flattened.push([[keyOrIndex], value]);
            continue;
        }

        // Array
        if (Array.isArray(value)) {
            if (value.length === 0) {
                flattened.push([[keyOrIndex], []]);
                continue;
            }

            for (const [item, index] of iterator(value)) {
                const itemKeyOrIndex = [keyOrIndex, index];
                if (!isObject(item)) {
                    flattened.push([itemKeyOrIndex, item]);
                    continue;
                }

                const innerFlattened = flatten(item, depth - 1, seen);
                const innerFlattenedMapped = innerFlattened.map(([subKey, subValue]) => {
                    return [itemKeyOrIndex.concat(subKey), subValue];
                });
                flattened.push(...innerFlattenedMapped);
            }
            continue;
        }

        // Object
        if (isObjectEmpty(value)) {
            flattened.push([[keyOrIndex], {}]);
            continue;
        }

        const innerFlattened = flatten(value, depth - 1, seen);
        const mappedInnerFlattened = innerFlattened.map(([subKey, subValue]) => {
            return [[keyOrIndex].concat(subKey), subValue];
        });
        flattened.push(...mappedInnerFlattened);
    }

    // Remove the current object from the set of seen objects before returning
    seen.delete(obj);

    return flattened;
}

function flattenKeys(keys) {
    let res = '';
    if (keys.length === 0) {
        return res;
    }

    const reIsIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (isNumber(key)) {
            res += `[${key}]`;
            continue;
        }
        if (reIsIdentifier.test(key)) {
            const isFirst = i === 0;
            res += isFirst ? key : `.${key}`;
            continue;
        }
        res += `[${JSON.stringify(key)}]`;
    }
    return res;
}

function resolveFlattenedKeys(obj, keys) {
    let currObj = obj;
    for (const key of keys) {
        if (!isObject(currObj)) {
            return undefined;
        }
        currObj = currObj[key];
    }
    return currObj;
}

function isInstanceOf(obj, constructor) {
    return obj instanceof constructor;
}

function isBigInt(obj) {
    return typeof obj === 'bigint';
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function isNumber(obj) {
    return typeof obj === 'number';
}

function isObject(obj) {
    return Object(obj) === obj;
}

function isObjectEmpty(obj) {
    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            return false;
        }
    }
    return true;
}

function isSymbol(obj) {
    return typeof obj === 'symbol';
}

function* iterator(obj) {
    // Array
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            yield [obj[i], i, obj];
        }
        return;
    }

    // Object
    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            yield [obj[key], key, obj];
        }
    }
}
