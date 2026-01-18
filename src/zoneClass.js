/* eslint-disable sonarjs/public-static-readonly */

// URL: https://gist.github.com/softwarespot/18b6e783d6b0ea14232e0fa224d01d1e

export class Zone {
    static #current = undefined;

    static get current() {
        return Zone.#current;
    }

    static set current(zone) {
        // Allow clearing the current zone with `undefined`.
        if (zone !== undefined && !isZone(zone)) {
            throw new Error('Zone.current must be an instance of Zone or undefined');
        }
        Zone.#current = zone;
    }

    static #globalErrorHandler = undefined;

    static get globalErrorHandler() {
        return Zone.#globalErrorHandler;
    }

    static set globalErrorHandler(fn) {
        if (fn !== undefined && !isFunction(fn)) {
            throw new Error('Zone.globalErrorHandler must be a function or undefined');
        }
        Zone.#globalErrorHandler = fn;
    }

    static get root() {
        let rootZone = Zone.current;
        while (rootZone.parent) {
            rootZone = rootZone.parent;
        }
        return rootZone;
    }

    #id = undefined;
    #name = undefined;
    #props = undefined;
    #onHandleError = undefined;

    constructor(spec = undefined, parent = undefined) {
        if (spec !== undefined && !isZoneSpec(spec)) {
            throw new Error('Zone spec must be created using createZoneSpec() function');
        }

        if (parent !== undefined && !isZone(parent)) {
            throw new Error('Parent zone must be an instance of Zone');
        }

        const hasParentZone = isZone(parent);
        this.parent = hasParentZone ? parent : undefined;

        const parentId = hasParentZone ? this.parent.id : 'root';
        const parentName = hasParentZone ? this.parent.name : undefined;
        const parentProps = hasParentZone ? this.parent.props : {};

        if (isZoneSpec(spec)) {
            this.#id = spec.id;
            this.#name = spec.name;

            // Ensure immutability
            this.#props = Object.freeze({
                ...parentProps,
                ...spec.props,
            });
            this.#onHandleError = isFunction(spec.onHandleError) ? spec.onHandleError : undefined;
        } else {
            this.#id = parentId;
            this.#name = parentName;
            this.#props = parentProps;
            this.#onHandleError = hasParentZone ? this.parent.#onHandleError : undefined;
        }
    }

    #handleError(err) {
        if (isFunction(this.#onHandleError)) {
            try {
                const suppress = this.#onHandleError(err, this);
                if (suppress === true) {
                    return true;
                }
            } catch {
                // Ignore error
            }
        }

        if (isFunction(Zone.globalErrorHandler)) {
            try {
                const suppress = Zone.globalErrorHandler(err, this);
                if (suppress === true) {
                    return true;
                }
            } catch {
                // Ignore error
            }
        }
        return false;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get props() {
        return this.#props;
    }

    fork(spec = undefined) {
        return new Zone(spec, this);
    }

    run(fn, ...args) {
        const prevZone = Zone.current;
        Zone.current = this;

        try {
            const res = fn(...args);
            return res;
        } catch (err) {
            if (!this.#handleError(err)) {
                throw err;
            }
        } finally {
            Zone.current = prevZone;
        }
        return undefined;
    }

    async runAsync(fn, ...args) {
        const prevZone = Zone.current;
        Zone.current = this;

        try {
            const res = await fn(...args);
            return res;
        } catch (err) {
            if (!this.#handleError(err)) {
                throw err;
            }
        } finally {
            Zone.current = prevZone;
        }
        return undefined;
    }

    wrap(fn) {
        const zone = this;
        return (...args) => zone.run(fn, ...args);
    }

    wrapAsync(fn) {
        const zone = this;
        return async (...args) => zone.runAsync(fn, ...args);
    }

    get(key) {
        let zone = this;
        while (zone) {
            if (Object.hasOwn(zone.props, key)) {
                return zone.props[key];
            }
            zone = zone.parent;
        }
        return undefined;
    }

    getZoneWith(key) {
        let zone = this;
        while (zone) {
            if (Object.hasOwn(zone.props, key)) {
                return zone;
            }
            zone = zone.parent;
        }
        return undefined;
    }
}

export function newZone(spec = undefined, parent = undefined) {
    return new Zone(spec, parent);
}

export class ZoneSpec {
    constructor(id, { name = '', onHandleError = undefined, props = {} } = {}) {
        if (!isString(id) || id === '') {
            throw new Error('Zone spec id must be a non-empty string');
        }

        if (name !== undefined && !isString(name)) {
            throw new Error('Zone spec name must be a string');
        }

        if (!isPlainObject(props)) {
            throw new Error('Zone spec props must be a plain object');
        }

        if (onHandleError !== undefined && !isFunction(onHandleError)) {
            throw new Error('Zone spec onHandleError must be a function');
        }

        this.id = id;
        this.name = name;
        this.props = props;
        this.onHandleError = onHandleError;

        // Ensure immutability
        Object.freeze(this);
    }
}

export function newZoneSpec(id, { name = '', onHandleError = undefined, props = {} } = {}) {
    return new ZoneSpec(id, { name, onHandleError, props });
}

// Initialize the default root zone after `createZoneSpec` and `zoneSpec` are available
Zone.current = new Zone(newZoneSpec('root'), undefined);

export function onZoneError(fn) {
    Zone.globalErrorHandler = fn;
}

export function getCurrentZone() {
    return Object.freeze({
        id: Zone.current.id,
        name: Zone.current.name,
        props: Zone.current.props,
    });
}

export function forkCurrentZone(spec = undefined) {
    return Zone.current.fork(spec);
}

export function runInZone(zoneOrFn, fnOrSpec, ...args) {
    // Supports both:
    //     runInZone(fn, spec)
    //     runInZone(zone, fn, ...args)
    if (!isFunction(zoneOrFn)) {
        const zone = zoneOrFn;
        const fn = fnOrSpec;
        return zone.run(fn, ...args);
    }

    const fn = zoneOrFn;
    const spec = fnOrSpec ?? undefined;
    const zone = forkCurrentZone(spec);
    return zone.run(fn, ...args);
}

export async function runInZoneAsync(zoneOrFn, fnOrSpec, ...args) {
    // Supports both:
    //     runInZoneAsync(fn, spec)
    //     runInZoneAsync(zone, fn, ...args)
    if (!isFunction(zoneOrFn)) {
        const zone = zoneOrFn;
        const fn = fnOrSpec;
        return zone.runAsync(fn, ...args);
    }

    const fn = zoneOrFn;
    const spec = fnOrSpec ?? undefined;
    const zone = forkCurrentZone(spec);
    return zone.runAsync(fn, ...args);
}

export function wrap(zoneOrFn, fnOrSpec) {
    // Supports both:
    //     wrap(fn, spec)
    //     wrap(zone, fn)
    if (!isFunction(zoneOrFn)) {
        const zone = zoneOrFn;
        const fn = fnOrSpec;
        return zone.wrap(fn);
    }

    const fn = zoneOrFn;
    const spec = fnOrSpec ?? undefined;
    const zone = forkCurrentZone(spec);
    return zone.wrap(fn);
}

export function wrapAsync(zoneOrFn, fnOrSpec) {
    // Supports both:
    //     wrapAsync(fn, spec)
    //     wrapAsync(zone, fn)
    if (!isFunction(zoneOrFn)) {
        const zone = zoneOrFn;
        const fn = fnOrSpec;
        return zone.wrapAsync(fn);
    }

    const fn = zoneOrFn;
    const spec = fnOrSpec ?? undefined;
    const zone = forkCurrentZone(spec);
    return zone.wrapAsync(fn);
}

export function getZoneWith(key, startZone = Zone.current) {
    if (!isZone(startZone)) {
        throw new Error('startZone must be an instance of Zone');
    }
    return startZone.getZoneWith(key);
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function isPlainObject(obj) {
    if (!isObject(obj)) {
        return false;
    }

    const proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
}

function isObject(obj) {
    return Object(obj) === obj;
}

function isString(obj) {
    return typeof obj === 'string';
}

export function isZone(obj) {
    return obj instanceof Zone;
}

function isZoneSpec(obj) {
    return obj instanceof ZoneSpec;
}
