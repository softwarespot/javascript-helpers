export default class RingBuffer {
    static from(serialized) {
        const buf = new RingBuffer(serialized.items.length);
        buf.#items = Array.from(serialized.items);
        buf.#size = serialized.size;
        buf.#head = serialized.head;
        buf.#tail = serialized.tail;
        return buf;
    }

    #items = undefined;
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
        for (const [index] of this.iterFirstN(this.#size)) {
            yield index;
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

    *iterFirstN(n) {
        if (n <= 0) {
            return;
        }
        if (n > this.#size) {
            n = this.#size;
        }

        const maxSize = this.#items.length;
        for (let i = 0; i < n; i++) {
            const idx = (this.#head + i) % maxSize;
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

    get size() {
        return this.#size;
    }

    clear() {
        for (let i = 0; i < this.#items.length; i++) {
            this.#items[i] = null;
        }
        this.#size = 0;
        this.#head = 0;
        this.#tail = 0;
    }

    serialize() {
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        return {
            items: this.#items,
            size: this.#size,
            head: this.#head,
            tail: this.#tail,
        };
        /* eslint-enable sort-keys-fix/sort-keys-fix */
    }
}
