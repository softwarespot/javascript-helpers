export function toBytesString(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const kb = 1024;
    if (bytes <= 0) {
        return '0B';
    }

    const idx = Math.floor(Math.log(bytes) / Math.log(kb));
    const value = (bytes / kb ** idx).toFixed(2);
    return `${value}${units[idx]}`;
}
