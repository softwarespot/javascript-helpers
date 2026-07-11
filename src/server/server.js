import http from 'node:http';

import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR, writeError } from './responseUtils.js';
import { log } from './utils.js';

const HTTP_HANDLERS = new Map();

export function registerHandlerFunc(pattern, handlerFn) {
    HTTP_HANDLERS.set(pattern, handlerFn);
}

async function handler(req, res) {
    try {
        const baseURL = `http://${req.headers.host}/`;
        const reqURL = new URL(req.url, baseURL);

        const handlerFn = HTTP_HANDLERS.get(reqURL.pathname);
        if (!handlerFn) {
            writeError(req, res, new Error(`No handler function found`, HTTP_STATUS_BAD_REQUEST));
            return;
        }

        const params = reqURL.searchParams;
        await handlerFn(req, res, params);
    } catch (err) {
        writeError(req, res, err, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
}

export function serve(port) {
    const server = http.createServer(handler);
    server.listen(port, () => log(`started on port: ${port}`));
}
