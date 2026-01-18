import https from 'node:https';

class FetchError extends Error {
    constructor(msg, res, status, url) {
        super(msg);

        this.name = 'FetchError';
        try {
            if (isString(res)) {
                this.response = JSON.parse(res);
            }
        } catch {
            // Ignore error, as it's not decodable as JSON
            this.response = res;
        }
        this.status = status;
        this.url = url;
    }

    toString() {
        const res = typeof this.response === 'string' ? this.response : JSON.stringify(this.response);
        return `${this.name}: ${this.message} (Response: ${res}, Status: ${this.status}, URL: ${this.url})`;
    }
}

export async function safeFetchJSON(url, opts, verifySSL = true, maxTimeoutMs = 60_000) {
    const [res, err] = await safeFetch(url, opts, verifySSL, maxTimeoutMs);
    if (err) {
        return [undefined, err];
    }
    try {
        const data = await res.json();
        return [data, undefined];
    } catch {
        return [undefined, new FetchError('Fetch error', 'Fetch response. Invalid JSON content', res.status, url)];
    }
}

export async function unsafeFetchJSON(url, opts, verifySSL = true, maxTimeoutMs = 60_000) {
    const [res, err] = await safeFetchJSON(url, opts, verifySSL, maxTimeoutMs);
    if (err) {
        throw err;
    }
    return res;
}

export async function safeFetchNoContent(url, opts, maxTimeoutMs = 10_000) {
    const [, err] = await safeFetch(url, opts, maxTimeoutMs);
    return err;
}

async function safeFetch(url, opts, verifySSL = true, maxTimeoutMs = 10_000) {
    console.log(`Calling URL: "${url}", Verify SSL: ${verifySSL}`);
    const agent = new https.Agent({ rejectUnauthorized: verifySSL });

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), maxTimeoutMs);

    // Ensure the process can exit if this is the only active timer
    if (typeof timerId.unref === 'function') {
        timerId.unref();
    }
    const cleanup = () => clearTimeout(timerId);

    try {
        opts = { ...opts, ...{ agent, signal: controller.signal } };
        const res = await fetch(url, opts);
        if (!res.ok) {
            const data = await res.text();
            const err = new FetchError('Fetch error', data, res.status, url);
            return [undefined, err];
        }
        return [res, undefined];
    } catch (err) {
        if (err.name === 'AbortError' && controller.signal.aborted) {
            throw new FetchError(`Fetch timeout after ${maxTimeoutMs}ms`, undefined, 0, url);
        }
        return [undefined, err];
    } finally {
        cleanup();
    }
}

function isString(obj) {
    return typeof obj === 'string';
}
