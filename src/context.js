/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable sort-destructure-keys/sort-destructure-keys */
/* eslint-disable sort-keys-fix/sort-keys-fix */

export const ERROR_CANCELLED = new Error('context canceled');
export const ERROR_DEADLINE_EXCEEDED = new Error('context deadline exceeded');

export const CONTEXT_TYPE_BACKGROUND = 'background';
export const CONTEXT_TYPE_TODO = 'todo';
export const CONTEXT_TYPE_AFTER_FUNC = 'afterFunc';
export const CONTEXT_TYPE_CANCEL = 'cancel';
export const CONTEXT_TYPE_WITHOUT_CANCEL = 'withoutCancel';
export const CONTEXT_TYPE_TIMER = 'timer';
export const CONTEXT_TYPE_VALUE = 'value';

const noop = () => {};

export class Context {
    static background() {
        return new Context({
            type: CONTEXT_TYPE_BACKGROUND,
        });
    }

    static TODO() {
        return new Context({
            type: CONTEXT_TYPE_TODO,
        });
    }

    static afterFunc(parent, fn) {
        if (!isFunction(fn)) {
            throw new Error('Invalid "fn" argument, expected to be a function');
        }

        const ctx = this.#newCancelContext(parent, CONTEXT_TYPE_AFTER_FUNC, fn);
        ctx.#onControllerAbort(() => {
            if (ctx.#afterFuncCalled) {
                return;
            }
            ctx.#afterFuncCalled = true;

            setTimeout(() => {
                ctx.#afterFuncFn();
            }, 0);
        });

        return () => {
            if (ctx.#afterFuncCalled) {
                return false;
            }
            ctx.#afterFuncCalled = true;

            ctx.#cancel(ERROR_CANCELLED, false);

            return true;
        };
    }

    static withCancel(parent) {
        const ctx = this.#newCancelContext(parent, CONTEXT_TYPE_CANCEL, undefined);
        return [
            ctx,
            () => {
                ctx.#cancel(ERROR_CANCELLED, false);
            },
        ];
    }

    static withCancelCause(parent) {
        const ctx = this.#newCancelContext(parent, CONTEXT_TYPE_CANCEL, undefined);
        return [
            ctx,
            (cause) => {
                ctx.#cancel(cause, true);
            },
        ];
    }

    static #newCancelContext(parent, type, afterFuncFn) {
        validateParentContext(parent);

        const ctx = new Context({
            type,
            parent,
            controller: new AbortController(),

            afterFuncFn,
        });

        ctx.#onParentControllerAbort(parent);
        return ctx;
    }

    static withoutCancel(parent) {
        validateParentContext(parent);

        return new Context({
            type: CONTEXT_TYPE_WITHOUT_CANCEL,
            parent,
        });
    }

    static withDeadline(parent, dtDeadline) {
        const [timeoutMs, deadlineMs] = calcDeadline(dtDeadline);
        return this.#newTimerContext(parent, timeoutMs, deadlineMs, ERROR_DEADLINE_EXCEEDED, false);
    }

    static withDeadlineCause(parent, dtDeadline, cause) {
        const [timeoutMs, deadlineMs] = calcDeadline(dtDeadline);
        return this.#newTimerContext(parent, timeoutMs, deadlineMs, cause, true);
    }

    static withTimeout(parent, timeoutMs) {
        return this.#newTimerContext(parent, timeoutMs, Date.now() + timeoutMs, ERROR_DEADLINE_EXCEEDED, false);
    }

    static withTimeoutCause(parent, timeoutMs, cause) {
        return this.#newTimerContext(parent, timeoutMs, Date.now() + timeoutMs, cause, true);
    }

    static #newTimerContext(parent, timeoutMs, deadlineMs, cause, isCustomCause) {
        validateParentContext(parent);

        const ctx = new Context({
            type: CONTEXT_TYPE_TIMER,
            parent,
            controller: new AbortController(),
            deadline: deadlineMs,
        });

        ctx.#onParentControllerAbort(parent);
        if (ctx.aborted) {
            return [ctx, noop];
        }

        if (timeoutMs <= 0) {
            ctx.#cancel(cause, isCustomCause);
            return [ctx, noop];
        }

        const timerId = setTimeout(() => ctx.#cancel(cause, isCustomCause), timeoutMs);

        // Ensure the process can exit if this is the only active timer
        if (isFunction(timerId.unref)) {
            timerId.unref();
        }
        parent.#onControllerAbort(() => clearTimeout(timerId));

        return [
            ctx,
            () => {
                clearTimeout(timerId);
                ctx.#cancel(ERROR_CANCELLED, false);
            },
        ];
    }

    static withValue(parent, key, value) {
        validateParentContext(parent);

        return new Context({
            type: CONTEXT_TYPE_VALUE,
            parent,
            controller: parent.#controller,
            key,
            value,
        });
    }

    static cause(ctx) {
        if (!isContext(ctx)) {
            throw new Error('Invalid "ctx" context, expected to be an instance of "Context"');
        }

        if (ctx.error === undefined) {
            return undefined;
        }

        while (ctx !== undefined) {
            if (ctx.#cause !== undefined) {
                return ctx.#cause;
            }
            switch (ctx.#type) {
                case CONTEXT_TYPE_CANCEL:
                case CONTEXT_TYPE_TIMER:
                    ctx = ctx.#parent;
                    break;
                case CONTEXT_TYPE_VALUE:
                    ctx = ctx.#parent;
                    break;
                default:
                    ctx = undefined;
            }
        }
        return ctx.error;
    }

    #type = undefined;
    #parent = undefined;

    // AfterFunc context
    #afterFuncFn = undefined;
    #afterFuncCalled = false;

    // Timer context
    #controller = undefined;
    #deadlineMs = undefined;

    // Value context
    #key = undefined;
    #value = undefined;

    // Cancel cause
    #cause = undefined;

    constructor({
        type = undefined,
        parent = undefined,
        controller = undefined,

        afterFuncFn = undefined,

        deadline = undefined,

        key = undefined,
        value = undefined,
    } = {}) {
        this.#type = type;
        this.#parent = parent;
        this.#controller = controller;

        this.#afterFuncFn = afterFuncFn;

        this.#deadlineMs = deadline;

        this.#key = key;
        this.#value = value;
    }

    get type() {
        return this.#type;
    }

    get controller() {
        return this.#controller;
    }

    get signal() {
        if (this.#controller === undefined) {
            return undefined;
        }
        return this.#controller.signal;
    }

    get aborted() {
        if (this.#controller === undefined) {
            return false;
        }
        return this.#controller.signal.aborted;
    }

    get deadline() {
        switch (this.#type) {
            case CONTEXT_TYPE_TIMER:
                return [new Date(this.#deadlineMs), true];
            default:
                return [undefined, false];
        }
    }

    get error() {
        if (this.#controller === undefined) {
            return undefined;
        }
        return this.#controller.signal.reason;
    }

    value(key) {
        let ctx = this;
        while (ctx !== undefined) {
            switch (ctx.#type) {
                case CONTEXT_TYPE_CANCEL:
                case CONTEXT_TYPE_TIMER:
                    ctx = ctx.#parent;
                    break;
                case CONTEXT_TYPE_VALUE:
                    if (ctx.#key === key) {
                        return ctx.#value;
                    }
                    ctx = ctx.#parent;
                    break;
                default:
                    ctx = undefined;
            }
        }
        return undefined;
    }

    #values() {
        let values = {};
        let ctx = this;
        while (ctx !== undefined) {
            switch (ctx.#type) {
                case CONTEXT_TYPE_CANCEL:
                case CONTEXT_TYPE_TIMER:
                    ctx = ctx.#parent;
                    break;
                case CONTEXT_TYPE_VALUE:
                    // Only merge the key/value, if the key doesn't exist
                    if (!Object.hasOwn(values, ctx.#key)) {
                        values[ctx.#key] = ctx.#value;
                    }
                    ctx = ctx.#parent;
                    break;
                default:
                    ctx = undefined;
            }
        }
        return values;
    }

    done() {
        return new Promise((resolve) => {
            if (this.#controller === undefined) {
                resolve(undefined);
                return;
            }
            this.#onControllerAbort(() => resolve(this.error));
        });
    }

    toString() {
        const [deadline, hasDeadline] = this.deadline;
        return `Context(aborted=${this.aborted}, error=${this.error ?? null}, deadline=${hasDeadline ? deadline.toISOString() : null}, type=${this.#type}, values=${JSON.stringify(this.#values())})`;
    }

    toJSON() {
        const [deadline, hasDeadline] = this.deadline;
        return {
            aborted: this.aborted,
            error: this.error ?? null,
            deadline: hasDeadline ? deadline.toISOString() : null,
            type: this.#type,
            values: this.#values(),
        };
    }

    #onParentControllerAbort(parent) {
        if (parent.aborted) {
            this.#cancel(parent.error, false);
            return;
        }

        if (parent.#controller === undefined) {
            return;
        }
        parent.#onControllerAbort(() => this.#cancel(parent.error, false));
    }

    #onControllerAbort(fn) {
        if (this.aborted) {
            fn();
            return;
        }

        if (this.#controller === undefined) {
            return;
        }
        this.#controller.signal.addEventListener('abort', fn, { once: true });
    }

    #cancel(cause, isCustomCause) {
        if (this.aborted) {
            // This is not needed, as AbortController#abort is idempotent,
            // but has been kept so it matches the rest of the code
            return;
        }

        if (isCustomCause && this.#cause === undefined) {
            this.#cause = cause;
        }

        if (this.#controller === undefined) {
            return;
        }
        this.#controller.abort(cause);
    }
}

function isContext(ctx) {
    return ctx instanceof Context;
}

function isFunction(fn) {
    return typeof fn === 'function';
}

function validateParentContext(parent) {
    if (!isContext(parent)) {
        throw new Error('Invalid "parent" context, expected to be an instance of "Context"');
    }
}

function calcDeadline(dtDeadline) {
    const dtNow = Date.now();
    const timeoutMs = dtDeadline.getTime() - dtNow;
    return [timeoutMs, dtNow + timeoutMs];
}
