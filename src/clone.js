export function clone(obj) {
    // When structuredClone is not available
    return JSON.parse(JSON.stringify(obj));
}
