export function* iterator(obj) {
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

export function forEach(obj, fn) {
    // Array
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (fn(obj[i], i, obj) === false) {
                break;
            }
        }
        return;
    }

    // Object
    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            if (fn(obj[key], key, obj) === false) {
                break;
            }
        }
    }
}
