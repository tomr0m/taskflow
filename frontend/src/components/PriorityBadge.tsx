import { ItemPriority } from '../lib/itemApi';

const styles: Record<ItemPriority, string> = {
  LOW: 'text-gray-600',
  MEDIUM: 'text-gray-400',
  HIGH: 'text-amber-500',
  URGENT: 'text-red-400',
};

const labels: Record<ItemPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const PriorityBadge = ({ priority }: { priority: ItemPriority }) => (
  <span className={`text-xs font-medium ${styles[priority]}`}>{labels[priority]}</span>
);
