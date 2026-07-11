import { useCallback, useState } from 'react';

const globalQueryParams = new URLSearchParams(window.location.search);

function getGlobalQueryParam(key, initialState) {
    const value = globalQueryParams.get(key);
    if (value === null) {
        return initialState;
    }

    if (typeof initialState === 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        // Ignore error
    }
    return undefined;
}

function setGlobalQueryParam(key, value, defaultValue) {
    if (value === defaultValue) {
        globalQueryParams.delete(key);
    } else {
        // Skip, when null or undefined
        if (value === null || value === 'null' || value === undefined || value === 'undefined') {
            return;
        }

        value = typeof value === 'string' ? value : JSON.stringify(value);
        globalQueryParams.set(key, value);
    }

    const pathname =
        globalQueryParams.size > 0 ? `?${globalQueryParams.toString()}` : new URL(window.location.href).pathname;
    window.history.pushState({}, '', pathname);
}

export default function useQueryParamState(key, initialState) {
    const [queryParam, setQueryParam] = useState(getGlobalQueryParam(key, initialState));
    const set = useCallback(
        (valueOrFn) => {
            // React supports passing a function or value to the "setState" function
            if (typeof valueOrFn === 'function') {
                setQueryParam((prevValue) => {
                    const nextValue = valueOrFn(prevValue);
                    setGlobalQueryParam(key, nextValue, initialState);
                    return nextValue;
                });
            } else {
                setGlobalQueryParam(key, valueOrFn, initialState);
                setQueryParam(valueOrFn);
            }
        },
        [key, initialState],
    );
    return [queryParam, set];
}
