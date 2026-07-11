import { Context } from '../context.js';
import sleep from '../sleep.js';

// Root background context (no cancellation)
const ctx = Context.background();
displayContextInfo(ctx, 'backgroundCtx');

// Context (no cancellation, similar to background)
const todoCtx = Context.TODO();
displayContextInfo(todoCtx, 'todoCtx');
assertEqual(todoCtx.aborted, false, 'TODO context is not aborted');

// withoutCancel: creates a child that does not inherit parent's cancel
const [parentForNoCancel, parentForNoCancelCancel] = Context.withCancel(ctx);
const noCancelCtx = Context.withoutCancel(parentForNoCancel);
displayContextInfo(noCancelCtx, 'withoutCancelCtx before parent cancel');
parentForNoCancelCancel(new Error('parent canceled for withoutCancel'));

// Wait for parent cancellation to complete
await waitAndDisplay(noCancelCtx, 'withoutCancelCtx after parent cancel', parentForNoCancel);

// withValue (and override behavior)
const valueCtx = Context.withValue(ctx, 'user', 'alice');
console.log('value user:', valueCtx.value('user'));
assertEqual(valueCtx.value('user'), 'alice', 'valueCtx has user alice');
displayContextInfo(valueCtx, 'valueCtx');

const value1Ctx = Context.withValue(valueCtx, 'requestId', 'req-5678');
console.log('value user:', value1Ctx.value('user'));
console.log('value requestId:', value1Ctx.value('requestId'));
assertEqual(value1Ctx.value('requestId'), 'req-5678', 'value1Ctx requestId is correct');
displayContextInfo(value1Ctx, 'value1Ctx');

// value override: closer value shadows parent
const valueOverrideCtx = Context.withValue(value1Ctx, 'user', 'bob');
console.log('value at override ctx (user):', valueOverrideCtx.value('user'));
console.log('value at parent ctx (user):', value1Ctx.value('user'));
assertEqual(valueOverrideCtx.value('user'), 'bob', 'valueOverrideCtx user is bob');
displayContextInfo(valueOverrideCtx, 'valueOverrideCtx');

// withCancel (simple cancel)
const [cancelCtx, cancel] = Context.withCancel(ctx);
cancel('manual cancellation');
displayContextInfo(cancelCtx, 'cancelCtx');
assert(cancelCtx.aborted, 'cancelCtx is aborted');
assertEqual(cancelCtx.error?.message, 'context canceled', 'cancelCtx error message');

// Nested contexts and cancel propagation (withCancelCause)
const [parentCtx, parentCancel] = Context.withCancelCause(ctx);
const childCtx = Context.withValue(parentCtx, 'requestId', 'req-1234');
console.log('request ID:', childCtx.value('requestId'));
displayContextInfo(childCtx, 'childCtx before parent cancel');

// Cancel the parent context with a cause
parentCancel(new Error('parent cancelled'));

// Wait for cancellation to propagate
await waitAndDisplay(childCtx, 'childCtx after parent cancel', parentCtx);
console.log('Cause(childCtx):', Context.cause(childCtx));
console.log('Cause(parentCtx):', Context.cause(parentCtx));
assertEqual(Context.cause(parentCtx)?.message, 'parent cancelled', 'parentCtx cause message');
assertEqual(Context.cause(childCtx)?.message, 'parent cancelled', 'childCtx inherited cause message');

// Timers: withTimeout and withDeadline
const [timeoutCtx] = Context.withTimeout(ctx, 16);

// Allow the timeout to happen
await waitAndDisplay(timeoutCtx, 'timeoutCtx');

// withTimeoutCause: custom error cause
const customTimeoutCause = new Error('custom timeout cause');
const [timeoutCauseCtx] = Context.withTimeoutCause(ctx, 8, customTimeoutCause);
await waitAndDisplay(timeoutCauseCtx, 'timeoutCauseCtx');
assertEqual(timeoutCauseCtx.error, customTimeoutCause, 'timeoutCauseCtx.error equals custom cause');
assertEqual(Context.cause(timeoutCauseCtx), customTimeoutCause, 'Cause(timeoutCauseCtx) equals custom cause');

// Immediate timeout (timeout <= 0) results in immediate cancel
const [zeroTimeoutCtx] = Context.withTimeout(ctx, 0);
await waitAndDisplay(zeroTimeoutCtx, 'zeroTimeoutCtx');

// withDeadline
const dt = new Date();
dt.setMilliseconds(dt.getMilliseconds() + 8);
const [deadlineCtx] = Context.withDeadline(ctx, dt);
await waitAndDisplay(deadlineCtx, 'deadlineCtx');

// withDeadlineCause: custom error on deadline
const customDeadlineCause = new Error('custom deadline cause');
const dt2 = new Date();
dt2.setMilliseconds(dt2.getMilliseconds() + 8);
const [deadlineCauseCtx] = Context.withDeadlineCause(ctx, dt2, customDeadlineCause);
await waitAndDisplay(deadlineCauseCtx, 'deadlineCauseCtx');
assertEqual(deadlineCauseCtx.error, customDeadlineCause, 'deadlineCauseCtx.error equals custom cause');

// done() example: cancellation after timeout via withCancelCause
const [doneCtx, doneCancel] = Context.withCancelCause(ctx);
setTimeout(() => doneCancel(new Error('doneCtx cancelled after timeout')), 32);
await waitAndDisplay(doneCtx, 'doneCtx');
assertEqual(Context.cause(doneCtx)?.message, 'doneCtx cancelled after timeout', 'doneCtx cause message');

// afterFunc example: runs when parent is canceled
const [afterCtx, afterCancel] = Context.withCancel(ctx);

// Cause propagation example: child may have its own cause or inherit parent's cause
{
    const [p2, p2Cancel] = Context.withCancelCause(ctx);
    const [c2, c2Cancel] = Context.withCancelCause(p2);

    // Cancel child with its own cause first
    c2Cancel(new Error('child canceled with own cause'));
    // Then cancel parent with a different cause
    p2Cancel(new Error('parent canceled cause'));

    // Wait for both to be canceled
    await p2.done();
    await c2.done();
    await sleep(16);

    console.log('Cause(p2):', Context.cause(p2));
    console.log('Cause(c2):', Context.cause(c2));
}

let afterRan = false;
Context.afterFunc(afterCtx, () => {
    afterRan = true;
    console.log('afterFunc ran');
});

displayContextInfo(afterCtx, 'afterFuncCtx before cancel');
afterCancel(new Error('parent canceled for afterFunc'));

// Wait for cancellation to complete and allow the scheduled after-func to run
await waitAndDisplay(afterCtx, 'afterFuncCtx after cancel');
assert(afterRan === true, 'afterFunc ran');

// afterFunc suppression example: suppression should prevent the after function from running
const [afterSuppCtx, afterSuppCancel] = Context.withCancel(ctx);
let afterSuppRan = false;
const suppress = Context.afterFunc(afterSuppCtx, () => {
    afterSuppRan = true;
    console.log('afterFunc suppressed ran');
});

displayContextInfo(afterSuppCtx, 'afterFuncSuppressedCtx before suppress');
const suppressedResult = suppress();
afterSuppCancel(new Error('parent canceled for afterFunc suppressed'));

// Wait for cancellation to complete and allow any scheduled callbacks to run
await waitAndDisplay(afterSuppCtx, 'afterFuncSuppressedCtx after cancel');
assert(suppressedResult === true, 'afterFunc suppression returned true');
assert(afterSuppRan === false, 'afterFunc suppressed did not run');

function assert(condition, message) {
    if (!condition) {
        console.error(`✖ ${message}`);
    } else {
        console.log(`✅ ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        console.error(`✖ ${message}: expected ${String(expected)}, got ${String(actual)}`);
    } else {
        console.log(`✅ ${message}`);
    }
}

async function waitAndDisplay(ctx, name, waitOn) {
    if (waitOn !== undefined) {
        await waitOn.done();
    } else {
        await ctx.done();
    }
    await sleep(16);
    displayContextInfo(ctx, name);
}

function displayContextInfo(context, name) {
    console.log(`--- ${name} ---`);
    console.log('aborted:', context.aborted);
    console.log('error:', context.error);
    const [deadline, hasDeadline] = context.deadline;
    console.log('deadline:', hasDeadline ? deadline.toISOString() : null);
    console.log('toString():', context.toString());
    console.log('toJSON():', JSON.stringify(context));
    console.log('-------------------\n');
}
