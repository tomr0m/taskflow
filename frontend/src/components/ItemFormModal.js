import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
const TYPES = ['TASK', 'MEETING', 'REMINDER', 'DEADLINE', 'EVENT'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const TYPE_LABELS = {
    TASK: 'Task', MEETING: 'Meeting', REMINDER: 'Reminder', DEADLINE: 'Deadline', EVENT: 'Event',
};
const STATUS_LABELS = {
    TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done', CANCELLED: 'Cancelled',
};
const selectCls = 'w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white focus:outline-none focus:border-gray-400 transition disabled:opacity-50';
function toDateInput(iso) {
    if (!iso)
        return '';
    return iso.slice(0, 10);
}
export const ItemFormModal = ({ open, boardId, members, item, myRole, currentUserId, defaultStartDate, onClose, onSaved, onDeleted, onCreateItem, onUpdateItem, }) => {
    const isEdit = !!item;
    const canEdit = !isEdit || myRole === 'OWNER' || myRole === 'ADMIN' || item.createdById === currentUserId;
    const [type, setType] = useState(item?.type || 'TASK');
    const [title, setTitle] = useState(item?.title || '');
    const [description, setDescription] = useState(item?.description || '');
    const [status, setStatus] = useState(item?.status || 'TODO');
    const [priority, setPriority] = useState(item?.priority || 'MEDIUM');
    const [startDate, setStartDate] = useState(toDateInput(item?.startDate) || (!item ? (defaultStartDate ?? '') : ''));
    const [endDate, setEndDate] = useState(toDateInput(item?.endDate));
    const [assigneeId, setAssigneeId] = useState(item?.assigneeId ? String(item.assigneeId) : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const titleRef = useRef(null);
    // Reset form when item/open changes
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
    // Auto-focus title + Escape to close
    useEffect(() => {
        if (!open)
            return;
        setTimeout(() => titleRef.current?.focus(), 60);
        const handler = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit)
            return;
        setError('');
        setLoading(true);
        try {
            const data = {
                type, title: title.trim(),
                description: description.trim() || undefined,
                status, priority,
                startDate: startDate || null,
                endDate: endDate || null,
                assigneeId: assigneeId ? parseInt(assigneeId) : null,
            };
            const saved = isEdit
                ? await onUpdateItem(boardId, item.id, data)
                : await onCreateItem(boardId, data);
            onSaved(saved);
            onClose();
        }
        catch (err) {
            const msg = err
                ?.response?.data?.error?.message;
            setError(msg || 'Failed to save item');
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async () => {
        if (!item || !onDeleted)
            return;
        setLoading(true);
        try {
            onDeleted(item.id);
            onClose();
        }
        finally {
            setLoading(false);
        }
    };
    const canDelete = isEdit &&
        onDeleted &&
        (myRole === 'OWNER' || myRole === 'ADMIN' || item?.createdById === currentUserId);
    return (_jsx(AnimatePresence, { children: open && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-16 overflow-y-auto", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/75", onClick: onClose }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.96, y: -12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96 }, transition: { duration: 0.15 }, className: "relative bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-lg shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-5", children: [_jsx("h2", { className: "text-white font-semibold text-lg", children: isEdit ? (canEdit ? 'Edit Item' : 'Item Details') : 'New Item' }), _jsxs("div", { className: "flex items-center gap-3", children: [canDelete && !deleteConfirm && (_jsx("button", { onClick: () => setDeleteConfirm(true), className: "text-gray-600 hover:text-red-400 text-sm transition-colors", children: "Delete" })), deleteConfirm && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-500 text-xs", children: "Sure?" }), _jsx("button", { onClick: handleDelete, className: "text-red-400 text-xs hover:text-red-300", children: "Yes, delete" }), _jsx("button", { onClick: () => setDeleteConfirm(false), className: "text-gray-600 text-xs hover:text-gray-400", children: "Cancel" })] })), _jsx("button", { onClick: onClose, className: "text-gray-600 hover:text-white transition-colors", "aria-label": "Close", children: _jsx(X, { size: 18 }) })] })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Type" }), _jsx("div", { className: "flex flex-wrap gap-2", children: TYPES.map((t) => (_jsx("button", { type: "button", disabled: !canEdit, onClick: () => setType(t), className: `px-3 py-1 rounded text-xs font-medium transition ${type === t
                                                    ? 'bg-white text-black'
                                                    : 'bg-dark-bg border border-dark-border text-gray-400 hover:border-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`, children: TYPE_LABELS[t] }, t))) })] }), _jsx(Input, { ref: titleRef, label: "Title", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Item title", maxLength: 200, required: true, disabled: !canEdit }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-white mb-2", children: ["Description ", _jsx("span", { className: "text-gray-500 font-normal", children: "(optional)" })] }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Add details...", maxLength: 5000, rows: 3, disabled: !canEdit, className: "w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition resize-none disabled:opacity-50" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Status" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), disabled: !canEdit, className: selectCls, children: STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Priority" }), _jsx("select", { value: priority, onChange: (e) => setPriority(e.target.value), disabled: !canEdit, className: selectCls, children: PRIORITIES.map((p) => (_jsx("option", { value: p, children: p.charAt(0) + p.slice(1).toLowerCase() }, p))) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Start date" }), _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), disabled: !canEdit, className: selectCls })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "End date" }), _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), disabled: !canEdit, min: startDate || undefined, className: selectCls })] })] }), _jsxs("div", { className: "mb-5", children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Assignee" }), _jsxs("select", { value: assigneeId, onChange: (e) => setAssigneeId(e.target.value), disabled: !canEdit, className: selectCls, children: [_jsx("option", { value: "", children: "Unassigned" }), members.map((m) => (_jsxs("option", { value: String(m.userId), children: [m.user.name, m.userId === currentUserId ? ' (me)' : ''] }, m.userId)))] })] }), error && _jsx("p", { className: "text-red-400 text-sm mb-4", children: error }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: onClose, className: "flex-1", children: canEdit ? 'Cancel' : 'Close' }), canEdit && (_jsx(Button, { type: "submit", isLoading: loading, className: "flex-1", children: isEdit ? 'Save Changes' : 'Create Item' }))] })] })] })] })) }));
};
