import { iterator } from '../iter.js';

const arr = [10, 20, 30];
for (const [value, index] of iterator(arr)) {
    console.log(index, value);
}

const obj = {
    a: 1,
    b: {
        c: 2,
        d: [3, 4],
    },
    e: [5, { f: 6 }],
    g: null,
    h: undefined,
    i: () => {},
};
for (const [value, key] of iterator(obj)) {
    console.log(key, value);
}
