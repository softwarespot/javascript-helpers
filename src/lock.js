/* eslint-disable security/detect-non-literal-fs-filename */

// Similar to https://github.com/moxystudio/node-proper-lockfile

// import Lock from './src/lock.js';
// import sleep from './src/sleep.js';

// const lock = new Lock('my-lock');
// if (!(await lock.acquire())) {
//     throw new Error('Failed to acquire lock');
// }

// console.log('Lock acquired');
// await sleep(20000);

// await lock.release();
// console.log('Lock released');

import { rmdirSync } from 'node:fs';
import { mkdir, rmdir, stat, utimes } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function onExit(fn) {
    const signals = ['uncaughtException', 'exit', 'SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'];
    function onExitHandler(err) {
        // Remove all handlers when any signal is triggered
        for (const signal of signals) {
            process.off(signal, onExitHandler);
        }
        fn();

        // Re-throw uncaught exceptions
        if (err instanceof Error) {
            throw err;
        }
    }
    for (const signal of signals) {
        process.once(signal, onExitHandler);
    }
}

// A file-system based lock using atomic mkdir operations.
// This provides process-level locking across different Node.js processes
export default class Lock {
    #lockPath;
    #isLocked;
    #staleTimeoutMs;
    #refreshIntervalMs;
    #refreshTimerId;

    /**
     * @param {string} name The name of the lock. NOTE: A ".lock" suffix will be added automatically
     * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
     * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
     * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
     */
    constructor(name, dir = os.tmpdir(), staleTimeoutMs = 30_000, refreshIntervalMs = 5_000) {
        if (!name) {
            throw new Error('Lock name is empty');
        }

        this.#lockPath = path.join(dir, `${name}.lock`);
        this.#isLocked = false;

        this.#staleTimeoutMs = staleTimeoutMs;

        this.#refreshIntervalMs = refreshIntervalMs;
        this.#refreshTimerId = undefined;

        onExit(() => this.#cleanup());
    }

    async #acquire() {
        // Atomic operation, which succeeds only if the directory does not exist
        await mkdir(this.#lockPath);
        this.#isLocked = true;
        this.#scheduleUpdater();
    }

    #scheduleUpdater() {
        this.#refreshTimerId = setTimeout(async () => {
            try {
                const dtNow = new Date();
                await utimes(this.#lockPath, dtNow, dtNow);
            } catch {
                // Ignore error
            }

            if (this.#isLocked) {
                this.#scheduleUpdater();
            }
        }, this.#refreshIntervalMs);

        // Ensure the process can exit if this is the only active timer
        this.#refreshTimerId.unref();
    }

    #cleanup() {
        if (!this.#isLocked) {
            return;
        }

        if (this.#refreshTimerId) {
            clearTimeout(this.#refreshTimerId);
        }

        try {
            // Synchronous removal, to ensure the lock is released before exit
            rmdirSync(this.#lockPath);
            this.#isLocked = false;
        } catch {
            // Ignore error
        }
    }

    /**
     * Attempt to acquire the lock
     *
     * @returns {Promise<boolean>} True if the lock was acquired, false otherwise
     */
    async acquire() {
        if (this.#isLocked) {
            return false;
        }

        try {
            await this.#acquire();
            return true;
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }

        try {
            const stats = await stat(this.#lockPath);
            const ageMs = Date.now() - stats.mtimeMs;
            const isStale = ageMs > this.#staleTimeoutMs;
            if (!isStale) {
                return false;
            }

            // The lock is stale; therefore, attempt to remove and re-acquire
            await rmdir(this.#lockPath);
            await this.#acquire();
            return true;
        } catch {
            // Ignore error
        }
        return false;
    }

    /**
     * Release the lock
     *
     * @returns {Promise<void>}
     */
    async release() {
        if (!this.#isLocked) {
            return;
        }

        if (this.#refreshTimerId) {
            clearTimeout(this.#refreshTimerId);
            this.#refreshTimerId = undefined;
        }

        try {
            await rmdir(this.#lockPath);
        } catch (err) {
            // Ignore the error, when the lock has already been removed
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
        this.#isLocked = false;
    }
}
