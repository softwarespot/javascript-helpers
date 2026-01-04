export default class RingBuffer {
    static from(serialized) {
        const rb = new RingBuffer(serialized.maxSize);
        for (const item of serialized.items) {
            rb.push(item);
        }
        return rb;
    }

    #items;
    #size = 0;
    #head = 0;
    #tail = 0;

    constructor(maxSize) {
        if (maxSize <= 0) {
            throw new Error('maxSize must be greater than 0');
        }
        this.#items = new Array(maxSize);
    }

    *[Symbol.iterator]() {
        yield* this.values();
    }

    *keys() {
        for (const [i] of this.iterFirstN(this.#size)) {
            yield i;
        }
    }

    *values() {
        for (const [, item] of this.iterFirstN(this.#size)) {
            yield item;
        }
    }

    *entries() {
        yield* this.iterFirstN(this.#size);
    }

    n(n) {
        if (n > 0) {
            return this.firstN(n);
        }
        return this.lastN(-n);
    }

    firstN(n) {
        const items = [];
        for (const [, item] of this.iterFirstN(n)) {
            items.push(item);
        }
        return items;
    }

    lastN(n) {
        const items = [];
        for (const [, item] of this.iterLastN(n)) {
            items.push(item);
        }
        return items;
    }

    *iterN(n) {
        if (n > 0) {
            yield* this.iterFirstN(n);
            return;
        }
        yield* this.iterLastN(-n);
    }

    *iterFirstN(n) {
        if (n <= 0) {
            return;
        }
        if (n > this.#size) {
            n = this.#size;
        }

        const maxSize = this.#items.length;
        const head = this.#head;
        for (let i = 0; i < n; i++) {
            const idx = (head + i) % maxSize;
            yield [i, this.#items[idx]];
        }
    }

    *iterLastN(n) {
        if (n <= 0) {
            return;
        }
        if (n > this.#size) {
            n = this.#size;
        }

        const maxSize = this.#items.length;
        const head = (this.#tail - n + maxSize) % maxSize;
        for (let i = 0; i < n; i++) {
            const idx = (head + i) % maxSize;
            yield [i, this.#items[idx]];
        }
    }

    push(item) {
        const maxSize = this.#items.length;
        const isFull = this.#size === maxSize;

        const prevItem = this.#items[this.#tail];
        this.#items[this.#tail] = item;

        if (isFull) {
            this.#head = (this.#head + 1) % maxSize;
        } else {
            this.#size++;
        }
        this.#tail = (this.#tail + 1) % maxSize;
        return [prevItem, isFull];
    }

    pop() {
        if (this.#size === 0) {
            return [undefined, false];
        }

        const maxSize = this.#items.length;
        this.#tail = (this.#tail - 1 + maxSize) % maxSize;
        const item = this.#items[this.#tail];
        this.#items[this.#tail] = undefined;
        this.#size--;

        return [item, true];
    }

    popN(n) {
        const items = [];
        for (let i = 0; i < n; i++) {
            const [item, ok] = this.pop();
            if (!ok) {
                break;
            }
            items.push(item);
        }
        return items;
    }

    peekFront() {
        if (this.#size === 0) {
            return [undefined, false];
        }
        return [this.#items[this.#head], true];
    }

    unshift(item) {
        const maxSize = this.#items.length;
        const isFull = this.#size === maxSize;

        this.#head = (this.#head - 1 + maxSize) % maxSize;
        const prevItem = this.#items[this.#head];
        this.#items[this.#head] = item;

        if (isFull) {
            this.#tail = (this.#tail - 1 + maxSize) % maxSize;
        } else {
            this.#size++;
        }
        return [prevItem, isFull];
    }

    shift() {
        if (this.#size === 0) {
            return [undefined, false];
        }

        const maxSize = this.#items.length;
        const item = this.#items[this.#head];
        this.#items[this.#head] = undefined;
        this.#head = (this.#head + 1) % maxSize;
        this.#size--;

        return [item, true];
    }

    shiftN(n) {
        const items = [];
        for (let i = 0; i < n; i++) {
            const [item, ok] = this.shift();
            if (!ok) {
                break;
            }
            items.push(item);
        }
        return items;
    }

    peekBack() {
        if (this.#size === 0) {
            return [undefined, false];
        }

        const maxSize = this.#items.length;
        const idx = (this.#tail - 1 + maxSize) % maxSize;
        return [this.#items[idx], true];
    }

    get capacity() {
        return this.#items.length;
    }

    get size() {
        return this.#size;
    }

    isEmpty() {
        return this.#size === 0;
    }

    isFull() {
        const maxSize = this.#items.length;
        return this.#size === maxSize;
    }

    reset() {
        const maxSize = this.#items.length;
        for (let i = 0; i < maxSize; i++) {
            this.#items[i] = undefined;
        }
        this.#size = 0;
        this.#head = 0;
        this.#tail = 0;
    }

    serialize() {
        const maxSize = this.#items.length;
        const items = [];
        for (const item of this) {
            items.push(item);
        }

        /* eslint-disable sort-keys-fix/sort-keys-fix */
        return {
            maxSize,
            items,
        };
        /* eslint-enable sort-keys-fix/sort-keys-fix */
    }
}
