import os from 'node:os';

export function getUserName() {
    return os.userInfo().username;
}
