const state = {
    currZone: {},
    onError: undefined,
};

// Set an error handler for zone errors.
// The handler receives the error and the zone where it occurred.
// If the handler returns true, the error is suppressed and not re-thrown
export function onZoneError(fn) {
    state.onError = fn;
}

export function createInZone(fn, opts = {}) {
    const { useCurrentZone = false, ...zoneProps } = opts;
    const useCurrZone = useCurrentZone === true;

    const capturedZone = Object.freeze({
        ...state.currZone,
        ...zoneProps,
    });

    return (...args) => {
        const prevZone = state.currZone;
        const currZone = useCurrZone ? state.currZone : capturedZone;
        state.currZone = currZone;

        try {
            const res = fn(...args);
            return res;
        } catch (err) {
            if (!handleZoneError(err, currZone)) {
                throw err;
            }
        } finally {
            state.currZone = prevZone;
        }
        return undefined;
    };
}

export function createInZoneAsync(fn, opts = {}) {
    const { useCurrentZone = false, ...zoneProps } = opts;
    const useCurrZone = useCurrentZone === true;

    const capturedZone = Object.freeze({
        ...state.currZone,
        ...zoneProps,
    });

    return async (...args) => {
        const prevZone = state.currZone;
        const currZone = useCurrZone ? state.currZone : capturedZone;
        state.currZone = currZone;

        try {
            const res = await fn(...args);
            return res;
        } catch (err) {
            if (!handleZoneError(err, currZone)) {
                throw err;
            }
        } finally {
            state.currZone = prevZone;
        }
        return undefined;
    };
}

export function runInZone(fn, opts, ...args) {
    return createInZone(fn, opts)(...args);
}

export async function runInZoneAsync(fn, opts, ...args) {
    return createInZoneAsync(fn, opts)(...args);
}

export function getCurrentZone() {
    return Object.freeze({ ...state.currZone });
}

function isFunction(obj) {
    return typeof obj === 'function';
}

// Invoke the configured zone error handler (if any).
// Returns true when the error was handled and should be suppressed
function handleZoneError(err, currZone) {
    if (!isFunction(state.onError)) {
        return false;
    }

    try {
        const suppress = state.onError(err, currZone);
        return suppress === true;
    } catch {
        // Ignore error
    }
    return false;
}
