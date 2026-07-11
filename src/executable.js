import { spawnSync } from 'node:child_process';

export async function execSync(exec, args, maxBuffer = 10 * 1024 * 1024) {
    const ret = spawnSync(exec, args, { maxBuffer });
    if (ret.error) {
        const cmd = `${exec} ${args.join(' ')}`;
        throw new Error(`Command "${cmd}" failed. Stack: ${ret.error.stack}}`);
    }
    if (ret.status !== 0) {
        const stdout = String(ret.stdout);
        const stderr = String(ret.stderr);
        const cmd = `${exec} ${args.join(' ')}`;
        throw new Error(`Command "${cmd}" failed. Exit code: ${ret.status}, Stdout: "${stdout}", Stderr: "${stderr}"`);
    }
    return String(ret.stdout);
}
