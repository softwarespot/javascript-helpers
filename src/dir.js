import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getDirname(filePath) {
    return dirname(fileURLToPath(filePath));
}
