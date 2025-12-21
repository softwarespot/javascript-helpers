import { safeFunc } from '../func.js';

function mayThrow(a, b) {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return a / b;
}

const safeMayThrow = safeFunc(mayThrow);

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
