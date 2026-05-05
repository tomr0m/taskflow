import { ItemStatus } from '../lib/itemApi';

const accentStyle = {
  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
  color: 'var(--accent)',
  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
};

const grayscaleStyles: Partial<Record<ItemStatus, string>> = {
  TODO: 'border border-gray-700 text-gray-500',
  IN_PROGRESS: 'border border-gray-500 text-gray-300',
  CANCELLED: 'border border-gray-800 text-gray-700',
};

const labels: Record<ItemStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export const StatusBadge = ({ status }: { status: ItemStatus }) => {
  if (status === 'DONE') {
    return (
      <span className="text-xs px-2 py-0.5 rounded font-medium" style={accentStyle}>
        {labels[status]}
      </span>
    );
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${grayscaleStyles[status]}`}>
      {labels[status]}
    </span>
  );
};
