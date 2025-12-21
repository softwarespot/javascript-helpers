export function safeJSONParse(str, defaultValue = undefined) {
    try {
        return JSON.parse(str);
    } catch {
        // Ignore error
        return defaultValue;
    }
}
