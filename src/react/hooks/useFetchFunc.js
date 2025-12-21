import { useCallback, useEffect, useRef, useState } from 'react';

export const STATUS_IDLE = 'idle';
export const STATUS_LOADING = 'loading';
export const STATUS_RESOLVED = 'resolved';
export const STATUS_REJECTED = 'rejected';

export function useFetchFunc(fn, updateIntervalMs = 0) {
    const [status, setStatus] = useState(STATUS_IDLE);
    const [data, setData] = useState([]);
    const [lastModified, setLastModified] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [nextUpdate, setNextUpdate] = useState(
        updateIntervalMs > 0 ? new Date(Date.now() + updateIntervalMs) : undefined,
    );
    const [fetchCounter, setFetchCounter] = useState(0);
    const abortControllerRef = useRef(null);

    const fetchData = useCallback(async () => {
        // Abort previous request if still running
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const isInitialLoad = status === STATUS_IDLE;

        try {
            if (isInitialLoad) {
                setStatus(STATUS_LOADING);
            } else {
                setIsRefreshing(true);
            }

            const res = await fn();

            // Only update if this request wasn't aborted
            if (!abortController.signal.aborted) {
                setData(res);
                setLastModified(new Date());
                setStatus(STATUS_RESOLVED);
            }
        } catch (err) {
            // Only handle error if not aborted
            if (!abortController.signal.aborted) {
                console.error(err);
                setStatus(STATUS_REJECTED);
            }
        } finally {
            if (!abortController.signal.aborted) {
                setIsRefreshing(false);
            }
        }
    }, [fn, status]);

    useEffect(() => {
        fetchData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchCounter, fetchData]);

    useEffect(() => {
        if (updateIntervalMs === 0) {
            return;
        }

        const intervalId = setInterval(() => {
            setNextUpdate(new Date(Date.now() + updateIntervalMs));
            setFetchCounter((prevCounter) => prevCounter + 1);
        }, updateIntervalMs);

        return () => clearInterval(intervalId);
    }, [updateIntervalMs]);

    const refresh = useCallback(() => {
        setFetchCounter((prevCounter) => prevCounter + 1);
        setNextUpdate(updateIntervalMs > 0 ? new Date(Date.now() + updateIntervalMs) : undefined);
    }, [updateIntervalMs]);

    return [status, data, { isRefreshing, lastModified, nextUpdate, refresh }];
}
