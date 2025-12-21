import RingBuffer from '../ringBuffer.js';

const rb = new RingBuffer(3);

rb.push('Event 1');
rb.push('Event 2');
rb.push('Event 3');
rb.push('Event 4');
rb.push('Event 5');

console.log(Array.from(rb.keys()));
console.log(Array.from(rb.values()));
console.log(Array.from(rb.entries()));

console.log('serialize', RingBuffer.from(rb.serialize()).serialize());

console.log('firstN', rb.firstN(2));
for (const [i, item] of rb.iterFirstN(2)) {
    console.log('iterFirstN', i, item);
}

console.log('lastN', rb.lastN(2));
for (const [i, item] of rb.iterLastN(2)) {
    console.log('iterLastN', i, item);
}
