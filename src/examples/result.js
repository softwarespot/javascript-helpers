import Result from '../result.js';

display(Result.ok(42));
display(Result.err(new Error('Something went wrong')));

const res0 = Result.from((a, b) => a / b, 10, 2);
display(res0);

const res1 = await Result.fromAsync(
    async (a, b) => {
        if (b === 0) {
            throw new Error('Division by zero');
        }
        return a / b;
    },
    10,
    0,
);
display(res1);

function display(res) {
    if (res.ok) {
        console.log('Result is OK:', res.value);
    } else {
        console.error('Result is Error:', res.error);
    }
    console.log('toJSON', JSON.stringify(res));
    console.log('toString', res.toString());
    console.log('unwrapOr', res.unwrapOr(-1));
    console.log();
}
