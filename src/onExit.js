// Taken from URL: https://github.com/tapjs/signal-exit/blob/main/src/signals.ts
const SIGNALS = [
    'uncaughtException',
    'exit',
    'SIGABRT',
    'SIGALRM',
    'SIGHUP',
    'SIGINT',
    'SIGIO',
    'SIGIOT',
    'SIGPOLL',
    'SIGPWR',
    'SIGQUIT',
    'SIGSTKFLT',
    'SIGSYS',
    'SIGTERM',
    'SIGTRAP',
    'SIGUSR2',
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
];

export default function onExit(fn) {
    function onExitHandler(err) {
        // Remove all handlers when any signal is triggered
        for (const signal of SIGNALS) {
            process.off(signal, onExitHandler);
        }
        fn();

        // Re-throw uncaught exceptions
        if (err instanceof Error) {
            throw err;
        }
    }
    for (const signal of SIGNALS) {
        process.once(signal, onExitHandler);
    }
}
