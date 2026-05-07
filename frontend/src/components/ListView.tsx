import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, InboxIcon } from 'lucide-react';
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
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export const ListView = ({ items, onItemClick, hasFilters, onClearFilters }: ListViewProps) => {
  const [collapsed, setCollapsed] = useState<Set<ItemStatus>>(new Set(['CANCELLED']));

  const grouped = STATUS_ORDER.reduce<Record<ItemStatus, Item[]>>(
    (acc, s) => { acc[s] = items.filter((i) => i.status === s); return acc; },
    { TODO: [], IN_PROGRESS: [], DONE: [], CANCELLED: [] }
  );

  const toggle = (s: ItemStatus) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  // All items filtered away
  if (items.length === 0 && hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-14 h-14 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center mb-4">
          <SlidersHorizontal size={22} className="text-gray-600" />
        </div>
        <h3 className="text-white font-semibold mb-1">No items match these filters</h3>
        <p className="text-gray-600 text-sm mb-5">Try adjusting or clearing your filters.</p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-gray-400 hover:text-white text-sm underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        )}
      </motion.div>
    );
  }

  // Truly empty board
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-14 h-14 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center mb-4">
          <InboxIcon size={22} className="text-gray-600" />
        </div>
        <h3 className="text-white font-semibold mb-1">No items yet</h3>
        <p className="text-gray-600 text-sm">Create your first item using the button above.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {STATUS_ORDER.map((status) => {
        const group = grouped[status];
        const isCollapsed = collapsed.has(status);

        return (
          <div
            key={status}
            className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggle(status)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-medium text-sm">{STATUS_LABELS[status]}</span>
                <span className="text-gray-600 text-xs bg-dark-bg px-1.5 py-0.5 rounded">
                  {group.length}
                </span>
              </div>
              <span className="text-gray-700 text-xs">{isCollapsed ? '▸' : '▾'}</span>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  {group.length === 0 ? (
                    <div className="px-4 py-3 text-gray-700 text-sm italic border-t border-dark-border">
                      No items
                    </div>
                  ) : (
                    <AnimatePresence>
                      {group.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <ItemCard item={item} onClick={onItemClick} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
