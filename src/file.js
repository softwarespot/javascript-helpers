/* eslint-disable security/detect-non-literal-fs-filename */

import { randomBytes } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';

export function readFileAsJSON(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function atomicWriteFileAsJSON(filePath, data) {
    const tmpFilePath = `${filePath}.${randomBytes(8).toString('hex')}.tmp`;
    writeFileSync(tmpFilePath, JSON.stringify(data));
    renameSync(tmpFilePath, filePath);
}
