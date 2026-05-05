import { ItemPriority } from '../lib/itemApi';

const accentStyle = {
  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
  color: 'var(--accent)',
  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
};

const grayscaleStyles: Partial<Record<ItemPriority, string>> = {
  LOW: 'text-gray-600',
  MEDIUM: 'text-gray-400',
  HIGH: 'text-amber-500',
};

const labels: Record<ItemPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const PriorityBadge = ({ priority }: { priority: ItemPriority }) => {
  if (priority === 'URGENT') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded" style={accentStyle}>
        {labels[priority]}
      </span>
    );
  }
  return (
    <span className={`text-xs font-medium ${grayscaleStyles[priority]}`}>
      {labels[priority]}
    </span>
  );
};
