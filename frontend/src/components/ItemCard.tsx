import { Item } from '../lib/itemApi';
import { ItemTypeIcon } from './ItemTypeIcon';
import { PriorityBadge } from './PriorityBadge';

interface ItemCardProps {
  item: Item;
  onClick: (item: Item) => void;
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const ItemCard = ({ item, onClick }: ItemCardProps) => {
  const start = formatDate(item.startDate);
  const end = formatDate(item.endDate);

  return (
    <div
      onClick={() => onClick(item)}
      className="flex items-center gap-3 px-4 py-3 border-b border-dark-border hover:bg-dark-surface cursor-pointer transition-colors group"
    >
      <div className="shrink-0 mt-0.5">
        <ItemTypeIcon type={item.type} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{item.title}</div>
        {item.description && (
          <div className="text-gray-600 text-xs truncate mt-0.5">{item.description}</div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        {(start || end) && (
          <span className="text-gray-600 text-xs hidden sm:block">
            {start && end ? `${start} – ${end}` : start || end}
          </span>
        )}

        <PriorityBadge priority={item.priority} />

        {item.assignee && (
          <div
            title={item.assignee.name}
            className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white shrink-0"
          >
            {item.assignee.name[0].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};
