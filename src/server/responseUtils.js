export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const DEFAULT_HEADERS = {
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Origin': '*',
    // 'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
};

export function writeResponse(req, res, data, statusCode) {
    res.writeHead(statusCode, DEFAULT_HEADERS);
    res.end(JSON.stringify(data));
}

export function writeError(req, res, err, statusCode) {
    console.log(`Request URL (error): "${req.url}", ${err}`);
    writeResponse(
        req,
        res,
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        {
            error: err.toString(),
            errStack: err.stack,
        },
        /* eslint-enable sort-keys-fix/sort-keys-fix */
        statusCode,
    );
}
