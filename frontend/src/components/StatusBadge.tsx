import { ItemStatus } from '../lib/itemApi';

const styles: Record<ItemStatus, string> = {
  TODO: 'border border-gray-700 text-gray-500',
  IN_PROGRESS: 'border border-gray-500 text-gray-300',
  DONE: 'border border-green-800 text-green-500',
  CANCELLED: 'border border-gray-800 text-gray-700',
};

const labels: Record<ItemStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export const StatusBadge = ({ status }: { status: ItemStatus }) => (
  <span className={`text-xs px-2 py-0.5 rounded font-medium ${styles[status]}`}>
    {labels[status]}
  </span>
);
