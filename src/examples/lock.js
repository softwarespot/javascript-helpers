import Lock, { checkLockSync, getLock, getLockSync } from '../lock.js';
import sleep from '../sleep.js';

const lock0 = new Lock('my-lock');
if (!(await lock0.acquire())) {
    throw new Error('Failed to acquire lock');
}

console.log('Lock 0 acquired');
await sleep(5_000);

await lock0.release();
console.log('Lock 0 released');

const [hasLocked1, releaseLock1] = await getLock('my-lock-1');
console.log('Lock 1 acquired', hasLocked1);
await sleep(5_000);

await releaseLock1();
console.log('Lock 1 released');

console.log('Lock 2 check', checkLockSync('my-lock-2'));
const [hasLocked2, releaseLock2] = getLockSync('my-lock-2');
console.log('Lock 2 acquired', hasLocked2);
console.log('Lock 2 check', checkLockSync('my-lock-2'));
await sleep(5_000);

releaseLock2();
console.log('Lock 2 released');
console.log('Lock 2 check', checkLockSync('my-lock-2'));
