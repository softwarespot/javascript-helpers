/* eslint-disable security/detect-non-literal-fs-filename */

import { randomBytes } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';

export function readFileSyncAsJSON(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function safeReadFileSyncAsJSON(filePath, defaultValue = undefined) {
    try {
        return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch {
        // Ignore error
    }
    return defaultValue;
}

export function atomicWriteFileSyncAsJSON(filePath, data) {
    const tmpFilePath = `${filePath}.${randomBytes(8).toString('hex')}.tmp`;
    writeFileSync(tmpFilePath, JSON.stringify(data));
    renameSync(tmpFilePath, filePath);
}
