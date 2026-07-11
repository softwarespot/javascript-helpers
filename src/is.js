export function isArray(obj) {
    return Array.isArray(obj);
}

export function isBigInt(obj) {
    return typeof obj === 'bigint';
}

export function isBoolean(obj) {
    return typeof obj === 'boolean';
}

export function isFunction(obj) {
    return typeof obj === 'function';
}

export function isNumber(obj) {
    return typeof obj === 'number';
}

export function isObject(obj) {
    return Object(obj) === obj;
}

export function isString(obj) {
    return typeof obj === 'string';
}

export function isSymbol(obj) {
    return typeof obj === 'symbol';
}

export function isInstanceOf(obj, constructor) {
    return obj instanceof constructor;
}

export function isEmpty(obj) {
    if (Array.isArray(obj) || isString(obj)) {
        return obj.length === 0;
    }
    return isObjectEmpty(obj);
}

export function isNumeric(value) {
    return !isNaN(value - parseFloat(value));
}

export function isPositiveNumber(num) {
    return isNumeric(num) && Number(num) > 0;
}

export function isNil(obj) {
    return obj === null || obj === undefined;
}

export function isPlainObject(obj) {
    if (!isObject(obj)) {
        return false;
    }

    const proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
}

export function isObjectEmpty(obj) {
    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            return false;
        }
    }
    return true;
}

export function isPromiseLike(obj) {
    return isObject(obj) && isFunction(obj.then);
}
