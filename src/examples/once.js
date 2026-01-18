import Once from '../once.js';

const once = new Once();
once.do(() => {
    console.log('This will be printed only once.');
});
await once.doAsync(async () => {
    console.log('This async function will NOT be executed.');
});
once.do(() => {
    console.log('This will NOT be printed.');
});

const onceAsync = new Once();
const waiter = onceAsync.doAsync(async () => {
    console.log('This async function will be executed only once.');

    // Simulate async operation
    return new Promise((resolve) => setTimeout(() => resolve(), 100));
});
onceAsync.do(() => {
    console.log('This will NOT be printed.');
});
await waiter;
await onceAsync.doAsync(async () => {
    console.log('This async function will NOT be executed.');
});
