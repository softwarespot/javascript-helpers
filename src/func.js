export function safeFunc(fn) {
    return (...args) => {
        try {
            return [fn(...args), undefined];
        } catch (err) {
            return [undefined, err];
        }
    };
}

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
