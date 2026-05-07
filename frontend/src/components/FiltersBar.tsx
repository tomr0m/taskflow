import { useSearchParams } from 'react-router-dom';
import { BoardMember } from '../lib/boardApi';
import { ItemType, ItemStatus } from '../lib/itemApi';

const ALL_TYPES: { label: string; value: ItemType | '' }[] = [
  { label: 'All Types', value: '' },
  { label: 'Tasks', value: 'TASK' },
  { label: 'Meetings', value: 'MEETING' },
  { label: 'Reminders', value: 'REMINDER' },
  { label: 'Deadlines', value: 'DEADLINE' },
  { label: 'Events', value: 'EVENT' },
];

const ALL_STATUSES: { label: string; value: ItemStatus | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'To Do', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'DONE' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

interface FiltersBarProps {
  members: BoardMember[];
  currentUserId: number;
}

const selectCls =
  'bg-dark-bg border border-dark-border text-gray-400 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-500 cursor-pointer transition-colors hover:border-gray-600';

export const FiltersBar = ({ members, currentUserId }: FiltersBarProps) => {
  const [params, setParams] = useSearchParams();

  const type = params.get('type') || '';
  const status = params.get('status') || '';
  const assigneeId = params.get('assigneeId') || '';

  const setFilter = (key: string, value: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  const hasFilters = !!(type || status || assigneeId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={type} onChange={(e) => setFilter('type', e.target.value)} className={selectCls}>
        {ALL_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select value={status} onChange={(e) => setFilter('status', e.target.value)} className={selectCls}>
        {ALL_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={assigneeId}
        onChange={(e) => setFilter('assigneeId', e.target.value)}
        className={selectCls}
      >
        <option value="">All Assignees</option>
        <option value={String(currentUserId)}>Me</option>
        {members
          .filter((m) => m.userId !== currentUserId)
          .map((m) => (
            <option key={m.userId} value={String(m.userId)}>{m.user.name}</option>
          ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => setParams({})}
          className="text-gray-600 hover:text-gray-300 text-sm transition-colors px-1"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
};
