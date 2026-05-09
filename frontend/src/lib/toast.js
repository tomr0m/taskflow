let items = [];
let counter = 0;
const listeners = new Set();
function notify() {
    const snapshot = [...items];
    listeners.forEach((l) => l(snapshot));
}
function add(message, type, duration = 4000) {
    const id = ++counter;
    items = [...items, { id, message, type }];
    notify();
    setTimeout(() => {
        items = items.filter((t) => t.id !== id);
        notify();
    }, duration);
}
export function subscribeToasts(listener) {
    listeners.add(listener);
    listener([...items]);
    return () => listeners.delete(listener);
}
export const toast = {
    success: (msg) => add(msg, 'success'),
    error: (msg) => add(msg, 'error'),
    info: (msg) => add(msg, 'info'),
};
