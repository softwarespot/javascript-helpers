export function addEventListener(el, eventName, selector, fn, opts) {
    const hasDelegation = isFunction(fn);
    if (!hasDelegation) {
        opts = fn;
        fn = selector;
        selector = undefined;
    }

    function wrappedFn(event) {
        if (!hasDelegation) {
            selector(event, event.target);
            return;
        }

        const targetEl = event.target.closest(selector);
        if (targetEl && el.contains(targetEl)) {
            fn(event, targetEl);
        }
    }

    el.addEventListener(eventName, wrappedFn, opts);
    return () => {
        el.removeEventListener(eventName, wrappedFn, opts);
    };
}

function isFunction(obj) {
    return typeof obj === 'function';
}
