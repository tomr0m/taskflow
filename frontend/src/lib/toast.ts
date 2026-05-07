export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let items: ToastItem[] = [];
let counter = 0;
const listeners = new Set<Listener>();

function notify() {
  const snapshot = [...items];
  listeners.forEach((l) => l(snapshot));
}

function add(message: string, type: ToastType, duration = 4000) {
  const id = ++counter;
  items = [...items, { id, message, type }];
  notify();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    notify();
  }, duration);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([...items]);
  return () => listeners.delete(listener);
}

export const toast = {
  success: (msg: string) => add(msg, 'success'),
  error: (msg: string) => add(msg, 'error'),
  info: (msg: string) => add(msg, 'info'),
};
