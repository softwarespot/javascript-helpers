import RingBuffer from '../ringBuffer.js';

const rb = new RingBuffer(3);

rb.push('Event 1');
rb.push('Event 2');

console.log();
console.log('serialize', RingBuffer.from(rb.serialize()).serialize());

console.log();

rb.push('Event 3');
rb.push('Event 4');
rb.push('Event 5');

console.log('keys', Array.from(rb.keys()));
console.log('values', Array.from(rb.values()));
console.log('entries', Array.from(rb.entries()));

console.log();
console.log('serialize', RingBuffer.from(rb.serialize()).serialize());

console.log();
console.log('firstN(2)', rb.firstN(2));
for (const [i, item] of rb.iterFirstN(2)) {
    console.log('iterFirstN(2)', i, item);
}

console.log();
console.log('lastN(2)', rb.lastN(2));
for (const [i, item] of rb.iterLastN(2)) {
    console.log('iterLastN(2)', i, item);
}

console.log('capacity', rb.capacity);
console.log('size', rb.size);
