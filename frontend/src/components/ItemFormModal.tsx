import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, ItemType, ItemStatus, ItemPriority, CreateItemData, UpdateItemData } from '../lib/itemApi';
import { BoardMember, Role } from '../lib/boardApi';
import { Input } from './Input';
import { Button } from './Button';

const TYPES: ItemType[] = ['TASK', 'MEETING', 'REMINDER', 'DEADLINE', 'EVENT'];
const STATUSES: ItemStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const PRIORITIES: ItemPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const TYPE_LABELS: Record<ItemType, string> = {
  TASK: 'Task',
  MEETING: 'Meeting',
  REMINDER: 'Reminder',
  DEADLINE: 'Deadline',
  EVENT: 'Event',
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

interface ItemFormModalProps {
  open: boolean;
  boardId: number;
  members: BoardMember[];
  item?: Item;
  myRole: Role;
  currentUserId: number;
  defaultStartDate?: string;
  onClose: () => void;
  onSaved: (item: Item) => void;
  onDeleted?: (itemId: number) => void;
  onCreateItem: (boardId: number, data: CreateItemData) => Promise<Item>;
  onUpdateItem: (boardId: number, itemId: number, data: UpdateItemData) => Promise<Item>;
}

const selectCls =
  'w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white focus:outline-none focus:border-gray-400';

function toDateInput(iso?: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export const ItemFormModal = ({
  open,
  boardId,
  members,
  item,
  myRole,
  currentUserId,
  defaultStartDate,
  onClose,
  onSaved,
  onDeleted,
  onCreateItem,
  onUpdateItem,
}: ItemFormModalProps) => {
  const isEdit = !!item;
  const canEdit =
    !isEdit ||
    myRole === 'OWNER' ||
    myRole === 'ADMIN' ||
    item.createdById === currentUserId;

  const [type, setType] = useState<ItemType>(item?.type || 'TASK');
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [status, setStatus] = useState<ItemStatus>(item?.status || 'TODO');
  const [priority, setPriority] = useState<ItemPriority>(item?.priority || 'MEDIUM');
  const [startDate, setStartDate] = useState(toDateInput(item?.startDate) || (!item ? (defaultStartDate ?? '') : ''));
  const [endDate, setEndDate] = useState(toDateInput(item?.endDate));
  const [assigneeId, setAssigneeId] = useState<string>(
    item?.assigneeId ? String(item.assigneeId) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Reset form when item changes
  useEffect(() => {
    setType(item?.type || 'TASK');
    setTitle(item?.title || '');
    setDescription(item?.description || '');
    setStatus(item?.status || 'TODO');
    setPriority(item?.priority || 'MEDIUM');
    setStartDate(toDateInput(item?.startDate) || (!item ? (defaultStartDate ?? '') : ''));
    setEndDate(toDateInput(item?.endDate));
    setAssigneeId(item?.assigneeId ? String(item.assigneeId) : '');
    setError('');
    setDeleteConfirm(false);
  }, [item, open, defaultStartDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setError('');
    setLoading(true);
    try {
      const data = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        startDate: startDate || null,
        endDate: endDate || null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
      };

      const saved = isEdit
        ? await onUpdateItem(boardId, item!.id, data)
        : await onCreateItem(boardId, data);

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDeleted) return;
    setLoading(true);
    try {
      onDeleted(item.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const canDelete =
    isEdit &&
    onDeleted &&
    (myRole === 'OWNER' || myRole === 'ADMIN' || item?.createdById === currentUserId);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative bg-dark-surface border border-dark-border rounded-lg p-6 w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">
                {isEdit ? (canEdit ? 'Edit Item' : 'Item Details') : 'New Item'}
              </h2>
              {canDelete && !deleteConfirm && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-gray-600 hover:text-red-400 text-sm transition-colors"
                >
                  Delete
                </button>
              )}
              {deleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Sure?</span>
                  <button onClick={handleDelete} className="text-red-400 text-xs hover:text-red-300">
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="text-gray-600 text-xs hover:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setType(t)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        type === t
                          ? 'bg-white text-black'
                          : 'bg-dark-bg border border-dark-border text-gray-400 hover:border-gray-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item title"
                maxLength={200}
                required
                disabled={!canEdit}
              />

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  maxLength={5000}
                  rows={3}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition resize-none disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ItemStatus)}
                    disabled={!canEdit}
                    className={`${selectCls} disabled:opacity-50`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ItemPriority)}
                    disabled={!canEdit}
                    className={`${selectCls} disabled:opacity-50`}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Start date */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!canEdit}
                    className={`${selectCls} disabled:opacity-50`}
                  />
                </div>
                {/* End date */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!canEdit}
                    min={startDate || undefined}
                    className={`${selectCls} disabled:opacity-50`}
                  />
                </div>
              </div>

              {/* Assignee */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-white mb-2">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={!canEdit}
                  className={`${selectCls} disabled:opacity-50`}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={String(m.userId)}>
                      {m.user.name}
                      {m.userId === currentUserId ? ' (me)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  {canEdit ? 'Cancel' : 'Close'}
                </Button>
                {canEdit && (
                  <Button type="submit" isLoading={loading} className="flex-1">
                    {isEdit ? 'Save Changes' : 'Create Item'}
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
