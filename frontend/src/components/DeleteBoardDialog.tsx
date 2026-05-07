import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface DeleteBoardDialogProps {
  open: boolean;
  boardName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteBoardDialog = ({ open, boardName, onClose, onConfirm }: DeleteBoardDialogProps) => {
  const [loading, setLoading] = useState(false);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl"
          >
            <h2 className="text-white font-semibold text-lg mb-2">Delete Board</h2>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">"{boardName}"</span>?{' '}
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirm}
                isLoading={loading}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
