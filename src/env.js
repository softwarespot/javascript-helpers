/* eslint-disable security/detect-non-literal-fs-filename */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function loadEnvFile(filePath) {
    const absFilePath = path.resolve(filePath);
    if (!existsSync(absFilePath)) {
        throw new Error(`.env file "${absFilePath}" is missing`);
    }

    const lines = readFileSync(absFilePath, 'utf8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) {
            continue;
        }

        const kv = trimmed.split('=');
        if (kv.length === 2) {
            process.env[kv[0].trim()] = kv[1].trim();
        }
    }
}
