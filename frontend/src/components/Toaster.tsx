import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { subscribeToasts, ToastItem } from '../lib/toast';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'text-green-400 border-green-800',
  error: 'text-red-400 border-red-800',
  info: 'text-gray-300 border-dark-border',
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const Icon = ICONS[item.type];
  const colors = COLORS[item.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 bg-dark-surface border rounded-lg px-4 py-3 shadow-xl max-w-sm w-full ${colors}`}
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <p className="flex-1 text-sm text-white leading-snug">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export const Toaster = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast item={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
