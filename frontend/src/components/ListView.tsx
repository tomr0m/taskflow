import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, ItemStatus } from '../lib/itemApi';
import { ItemCard } from './ItemCard';

const STATUS_ORDER: ItemStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

const STATUS_LABELS: Record<ItemStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

interface ListViewProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

export const ListView = ({ items, onItemClick }: ListViewProps) => {
  const [collapsed, setCollapsed] = useState<Set<ItemStatus>>(new Set(['CANCELLED']));

  const grouped = STATUS_ORDER.reduce<Record<ItemStatus, Item[]>>(
    (acc, s) => {
      acc[s] = items.filter((i) => i.status === s);
      return acc;
    },
    { TODO: [], IN_PROGRESS: [], DONE: [], CANCELLED: [] }
  );

  const toggle = (s: ItemStatus) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="text-5xl mb-5 select-none">◻</div>
        <h3 className="text-white font-semibold mb-1">No items yet</h3>
        <p className="text-gray-600 text-sm">Create your first one using the button above.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {STATUS_ORDER.map((status) => {
        const group = grouped[status];
        const isCollapsed = collapsed.has(status);

        return (
          <div key={status} className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(status)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-medium text-sm">{STATUS_LABELS[status]}</span>
                <span className="text-gray-600 text-xs">{group.length}</span>
              </div>
              <span className="text-gray-600 text-xs">{isCollapsed ? '▸' : '▾'}</span>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {group.length === 0 ? (
                    <div className="px-4 py-3 text-gray-700 text-sm italic border-t border-dark-border">
                      No items
                    </div>
                  ) : (
                    group.map((item) => (
                      <ItemCard key={item.id} item={item} onClick={onItemClick} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
