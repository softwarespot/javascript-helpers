export function forEach(obj, fn) {
    // Array
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            fn(obj[i], i, obj);
        }
        return;
    }

    // Object
    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            fn(obj[key], key, obj);
        }
    }
}
