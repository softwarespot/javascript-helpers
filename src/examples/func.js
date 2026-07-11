import { safeFunc, safeFuncAsync } from '../func.js';

function mayThrow(a, b) {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return a / b;
}

function mayThrowAsync(a, b) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (b === 0) {
                reject(new Error('Division by zero'));
            } else {
                resolve(a / b);
            }
        }, 100);
    });
}

const safeMayThrow = safeFunc(mayThrow);
const safeMayThrowAsync = safeFuncAsync(mayThrowAsync);

const [res0, err0] = safeMayThrow(10, 0);
if (err0) {
    console.error('Error occurred:', err0);
} else {
    console.log('Result:', res0);
}

// This will be executed, even though the previous call returned an error
const [res1, err1] = safeMayThrow(10, 2);
if (err1) {
    console.error('Error occurred:', err1);
} else {
    console.log('Result:', res1);
}

// This will be executed, even though the previous call returned an error

const [res2, err2] = await safeMayThrowAsync(10, 0);
if (err2) {
    console.error('Async error occurred:', err2);
} else {
    console.log('Async result:', res2);
}
