import { Context } from '../context.js';

// Root background context (no cancellation)
const ctx = Context.background();
console.log('isCancelled:', ctx.isCancelled());
console.log('reason:', ctx.reason());

// withCancel
const { cancel, ctx: cancelCtx } = ctx.withCancel();
cancel('manual cancel');
console.log('isCancelled (cancel):', cancelCtx.isCancelled());
console.log('reason (cancel):', cancelCtx.reason());

// withTimeout (demonstrates deadline cancellation)
const { ctx: timeoutCtx } = ctx.withTimeout(10);
// allow the timeout to occur
await new Promise((resolve) => setTimeout(() => resolve(), 64));
console.log('isCancelled (timeout):', timeoutCtx.isCancelled());
console.log('reason (timeout):', timeoutCtx.reason());

// withValue
const valCtx = ctx.withValue('user', 'alice');
console.log('value user:', valCtx.value('user'));
