export function clonePlainObject(obj) {
    // When structuredClone is not available
    return JSON.parse(JSON.stringify(obj));
}
