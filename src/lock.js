/* eslint-disable security/detect-non-literal-fs-filename */

// Similar to https://github.com/moxystudio/node-proper-lockfile

import { mkdirSync, rmdirSync, statSync } from 'node:fs';
import { mkdir, rmdir, stat, utimes } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_STALE_TIMEOUT_MS = 30_000;
const DEFAULT_REFRESH_INTERVAL_MS = 5_000;

function onExit(fn) {
    const signals = ['uncaughtException', 'exit', 'SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'];

    function cleanup() {
        for (const signal of signals) {
            process.off(signal, onExitHandler);
        }
    }

    function onExitHandler(err) {
        cleanup();
        fn();

        // Re-throw uncaught exceptions
        if (err instanceof Error) {
            throw err;
        }
    }

    for (const signal of signals) {
        process.once(signal, onExitHandler);
    }
    return cleanup;
}

// A file-system based lock using atomic mkdir operations.
// This provides process-level locking across different Node.js processes
export default class Lock {
    #lockPath;
    #isLocked;
    #staleTimeoutMs;
    #refreshIntervalMs;
    #refreshTimerId;
    #onExitCleanup;

    /**
     * @param {string} name The name of the lock. NOTE: A ".lock" suffix will be added automatically
     * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
     * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
     * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
     */
    constructor(
        name,
        dir = os.tmpdir(),
        staleTimeoutMs = DEFAULT_STALE_TIMEOUT_MS,
        refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
    ) {
        if (!name) {
            throw new Error('Lock name is empty');
        }

        this.#lockPath = path.join(dir, `${name}.lock`);
        this.#isLocked = false;

        this.#staleTimeoutMs = staleTimeoutMs;

        this.#refreshIntervalMs = refreshIntervalMs;
        this.#refreshTimerId = undefined;

        this.#onExitCleanup = onExit(() => this.#cleanup());
    }

    async #acquire() {
        // Atomic operation, which succeeds only if the directory does not exist
        await mkdir(this.#lockPath);
        this.#isLocked = true;
        this.#scheduleUpdater();
    }

    #acquireSync() {
        // Atomic operation, which succeeds only if the directory does not exist
        mkdirSync(this.#lockPath);
        this.#isLocked = true;
        this.#scheduleUpdater();
    }

    #cleanup() {
        if (!this.#isLocked) {
            return;
        }

        try {
            // Synchronous removal, to ensure the lock is released before exit
            rmdirSync(this.#lockPath);
            this.#isLocked = false;
        } catch {
            // Ignore error
        }

        this.#cleanupScheduleUpdater();
        this.#onExitCleanup();
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
        if (typeof this.#refreshTimerId.unref === 'function') {
            this.#refreshTimerId.unref();
        }
    }

    #cleanupScheduleUpdater() {
        if (this.#refreshTimerId) {
            clearTimeout(this.#refreshTimerId);
            this.#refreshTimerId = undefined;
        }
    }

    // NOTE: The try*() and try*Sync() methods intentionally duplicate logic rather than abstracting it.
    // This keeps each method self-contained and easier to understand, debug, and maintain.

    /**
     * Attempt to acquire the lock asynchronously and return error details
     *
     * @returns {Promise<[boolean, Error|undefined]>} A tuple containing the lock status and any error
     */
    async tryAcquire() {
        if (this.#isLocked) {
            return [false, undefined];
        }

        try {
            await this.#acquire();
            return [true, undefined];
        } catch (err) {
            if (!isExistsError(err)) {
                return [false, err];
            }
        }

        try {
            const stats = await stat(this.#lockPath);
            if (!isStale(stats.mtimeMs, this.#staleTimeoutMs)) {
                return [false, undefined];
            }

            // The lock is stale; therefore, attempt to remove and re-acquire
            await rmdir(this.#lockPath);
            await this.#acquire();
            return [true, undefined];
        } catch (err) {
            return [false, err];
        }
    }

    /**
     * Attempt to acquire the lock synchronously and return error details
     *
     * @returns {[boolean, Error|undefined]} A tuple containing the lock status and any error
     */
    tryAcquireSync() {
        if (this.#isLocked) {
            return [false, undefined];
        }

        try {
            this.#acquireSync();
            return [true, undefined];
        } catch (err) {
            if (!isExistsError(err)) {
                return [false, err];
            }
        }

        try {
            const stats = statSync(this.#lockPath);
            if (!isStale(stats.mtimeMs, this.#staleTimeoutMs)) {
                return [false, undefined];
            }

            // The lock is stale; therefore, attempt to remove and re-acquire
            rmdirSync(this.#lockPath);
            this.#acquireSync();
            return [true, undefined];
        } catch (err) {
            return [false, err];
        }
    }

    /**
     * Attempt to acquire the lock asynchronously
     *
     * @throws {Error} If an error occurs during the lock acquisition
     * @returns {Promise<boolean>} True if the lock was acquired; otherwise, false
     */
    async acquire() {
        const [acquired, err] = await this.tryAcquire();
        if (err) {
            throw err;
        }
        return acquired;
    }

    /**
     * Attempt to acquire the lock synchronously
     *
     * @throws {Error} If an error occurs during the lock acquisition
     * @returns {boolean} True if the lock was acquired; otherwise, false
     */
    acquireSync() {
        const [acquired, err] = this.tryAcquireSync();
        if (err) {
            throw err;
        }
        return acquired;
    }

    /**
     * Attempt to release the lock asynchronously and return error details
     *
     * @returns {Promise<Error|undefined>} The error if one occurred, or undefined
     */
    async tryRelease() {
        if (!this.#isLocked) {
            return undefined;
        }

        this.#cleanupScheduleUpdater();

        try {
            await rmdir(this.#lockPath);
        } catch (err) {
            if (!isMissingError(err)) {
                return err;
            }
        }

        this.#isLocked = false;

        return undefined;
    }

    /**
     * Attempt to release the lock synchronously and return error details
     *
     * @returns {Error|undefined} The error if one occurred, or undefined
     */
    tryReleaseSync() {
        if (!this.#isLocked) {
            return undefined;
        }

        this.#cleanupScheduleUpdater();

        try {
            rmdirSync(this.#lockPath);
        } catch (err) {
            if (!isMissingError(err)) {
                return err;
            }
        }

        this.#isLocked = false;

        return undefined;
    }

    /**
     * Release the lock asynchronously
     *
     * @throws {Error} If an error occurs during releasing the lock
     * @returns {Promise<void>}
     */
    async release() {
        const err = await this.tryRelease();
        if (err) {
            throw err;
        }
    }

    /**
     * Release the lock synchronously
     *
     * @throws {Error} If an error occurs during releasing the lock
     * @returns {void}
     */
    releaseSync() {
        const err = this.tryReleaseSync();
        if (err) {
            throw err;
        }
    }

    /**
     * Check asynchronously, if the lock is currently held and not stale
     *
     * @returns {Promise<boolean>} True if the lock exists and is not stale; otherwise, false
     */
    async check() {
        try {
            const stats = await stat(this.#lockPath);
            return !isStale(stats.mtimeMs, this.#staleTimeoutMs);
        } catch (err) {
            if (!isMissingError(err)) {
                throw err;
            }
            return false;
        }
    }

    /**
     * Check synchronously, if the lock is currently held and not stale
     *
     * @returns {boolean} True if the lock exists and is not stale; otherwise, false
     */
    checkSync() {
        try {
            const stats = statSync(this.#lockPath);
            return !isStale(stats.mtimeMs, this.#staleTimeoutMs);
        } catch (err) {
            if (!isMissingError(err)) {
                throw err;
            }
            return false;
        }
    }
}

function isStale(modifiedAtMs, staleTimeoutMs) {
    const ageMs = Date.now() - modifiedAtMs;
    return ageMs > staleTimeoutMs;
}

function isExistsError(err) {
    return err.code === 'EEXIST';
}

function isMissingError(err) {
    return err.code === 'ENOENT';
}

/**
 * Acquire a lock asynchronously and return a release function (safe version that returns errors)
 *
 * @param {string} name The name of the lock
 * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
 * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
 * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
 * @returns {Promise<[boolean, Function, Error|undefined]>} A tuple containing the lock status, release function, and any error
 */
export async function safeGetLock(
    name,
    dir = os.tmpdir(),
    staleTimeoutMs = DEFAULT_STALE_TIMEOUT_MS,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
) {
    const lock = new Lock(name, dir, staleTimeoutMs, refreshIntervalMs);
    const [isLocked, err] = await lock.tryAcquire();
    return [
        isLocked,
        async () => {
            if (!isLocked) {
                return undefined;
            }
            return await lock.tryRelease();
        },
        err,
    ];
}

/**
 * Acquire a lock synchronously and return a release function (safe version that returns errors)
 *
 * @param {string} name The name of the lock
 * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
 * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
 * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
 * @returns {[boolean, Function, Error|undefined]} A tuple containing the lock status, release function, and any error
 */
export function safeGetLockSync(
    name,
    dir = os.tmpdir(),
    staleTimeoutMs = DEFAULT_STALE_TIMEOUT_MS,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
) {
    const lock = new Lock(name, dir, staleTimeoutMs, refreshIntervalMs);
    const [isLocked, err] = lock.tryAcquireSync();
    return [
        isLocked,
        () => {
            if (!isLocked) {
                return undefined;
            }
            return lock.tryReleaseSync();
        },
        err,
    ];
}

/**
 * Acquire a lock asynchronously and return a release function
 *
 * @throws {Error} If an error occurs during the lock acquisition
 * @param {string} name The name of the lock
 * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
 * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
 * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
 * @returns {Promise<[boolean, Function]>} A tuple containing the lock status and a release function
 */
export async function getLock(
    name,
    dir = os.tmpdir(),
    staleTimeoutMs = DEFAULT_STALE_TIMEOUT_MS,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
) {
    const [isLocked, releaseFn, err] = await safeGetLock(name, dir, staleTimeoutMs, refreshIntervalMs);
    if (err) {
        throw err;
    }
    return [isLocked, releaseFn];
}

/**
 * Acquire a lock synchronously and return a release function
 *
 * @throws {Error} If an error occurs during the lock acquisition
 * @param {string} name The name of the lock
 * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
 * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
 * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
 * @returns {[boolean, Function]} A tuple containing the lock status and a release function
 */
export function getLockSync(
    name,
    dir = os.tmpdir(),
    staleTimeoutMs = DEFAULT_STALE_TIMEOUT_MS,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
) {
    const [isLocked, releaseFn, err] = safeGetLockSync(name, dir, staleTimeoutMs, refreshIntervalMs);
    if (err) {
        throw err;
    }
    return [isLocked, releaseFn];
}

/**
 * Check asynchronously if a lock exists and is not stale
 *
 * @param {string} name The name of the lock
 * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
 * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
 * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
 * @returns {Promise<boolean>} True if the lock exists and is not stale; otherwise, false
 */
export async function checkLock(
    name,
    dir = os.tmpdir(),
    staleTimeoutMs = DEFAULT_STALE_TIMEOUT_MS,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
) {
    const lock = new Lock(name, dir, staleTimeoutMs, refreshIntervalMs);
    return lock.check();
}

/**
 * Check synchronously if a lock exists and is not stale
 *
 * @param {string} name The name of the lock
 * @param {string} [dir] Directory to store lock files (defaults to OS temp dir)
 * @param {number} [staleTimeoutMs=30000] Time in milliseconds before a lock is considered as stale
 * @param {number} [refreshIntervalMs=5000] Time in milliseconds between "mtime" updates
 * @returns {boolean} True if the lock exists and is not stale; otherwise, false
 */
export function checkLockSync(
    name,
    dir = os.tmpdir(),
    staleTimeoutMs = DEFAULT_STALE_TIMEOUT_MS,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
) {
    const lock = new Lock(name, dir, staleTimeoutMs, refreshIntervalMs);
    return lock.checkSync();
}
