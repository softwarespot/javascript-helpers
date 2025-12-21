export function addEventListener(el, eventName, selector, fn) {
    function wrappedFn(event) {
        if (!isFunction(fn)) {
            selector(event, event.target);
            return;
        }

        const targetEl = event.target.closest(selector);
        if (targetEl && el.contains(targetEl)) {
            fn(event, targetEl);
        }
    }

    el.addEventListener(eventName, wrappedFn);

    return () => {
        el.removeEventListener(eventName, wrappedFn);
    };
}

function isFunction(obj) {
    return typeof obj === 'function';
}
