export function copyToClipboard(text, container = document.body) {
    const el = document.createElement('textarea');
    try {
        el.value = text;

        // Avoid scrolling to the bottom
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.top = '';

        container.appendChild(el);
        el.focus();
        el.select();

        document.execCommand('copy');
        return true;
    } catch {
        // Ignore error
    } finally {
        el.remove();
    }
    return false;
}
