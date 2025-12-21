export function isBoolean(obj) {
    return typeof obj === 'boolean';
}

export function isFunction(obj) {
    return typeof obj === 'function';
}

export function isNumber(obj) {
    return typeof obj === 'number';
}

export function isNumeric(value) {
    return !isNaN(value - parseFloat(value));
}

export function isObject(obj) {
    return Object(obj) === obj;
}

export function isObjectEmpty(obj) {
    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            return false;
        }
    }
    return true;
}

export function isPositiveNumber(num) {
    return Number(num) > 0;
}

export function isString(obj) {
    return typeof obj === 'string';
}
