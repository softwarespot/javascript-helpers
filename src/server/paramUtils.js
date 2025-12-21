import { withResolvers } from './utils.js';

export function getParam(params, name) {
    const value = params.get(name);
    if (value === null || value === undefined || value === '') {
        return [undefined, new Error(`Missing "${name}" query parameter`)];
    }
    return [value, undefined];
}

export async function readBodyAsJSON(req) {
    if (!['POST', 'PUT'].includes(req.method)) {
        return [undefined, new Error('Invalid HTTP method, expected POST or PUT')];
    }

    const chunks = [];
    const { promise, resolve } = withResolvers();
    req.on('data', (chunk) => {
        chunks.push(chunk);
    });
    req.on('end', () => {
        try {
            const body = Buffer.concat(chunks).toString();
            resolve([JSON.parse(body), undefined]);
        } catch {
            resolve([undefined, new Error('Invalid JSON in body')]);
        }
    });
    req.on('error', (err) => {
        resolve([undefined, err]);
    });
    return promise;
}
