export function debounce(fn, delayMs) {
    let timerId = 0;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            fn(...args);
        }, delayMs);
    };
}

export function throttle(fn, delayMs) {
    let lastCallMs = 0;
    return (...args) => {
        const now = Date.now();
        const elapsedMs = now - lastCallMs;
        if (elapsedMs >= delayMs) {
            lastCallMs = now;
            fn(...args);
        }
    };
}

export function setInterval(...args) {
    const timerId = globalThis.setInterval(...args);
    if (isFunction(timerId.unref)) {
        timerId.unref();
    }
    return timerId;
}

export function setTimeout(...args) {
    const timerId = globalThis.setTimeout(...args);
    if (isFunction(timerId.unref)) {
        timerId.unref();
    }
    return timerId;
}

function isFunction(obj) {
    return typeof obj === 'function';
}
