import { FlattenedJSON } from '../json.js';

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

const flattened = new FlattenedJSON(obj);

console.log('iterator', Array.from(flattened));
console.log('keys', Array.from(flattened.keys()));
console.log('values', Array.from(flattened.values()));
console.log('entries', Array.from(flattened.entries()));

console.log('flattenKeys', FlattenedJSON.flattenKeys(['b', 'd', 1]));
