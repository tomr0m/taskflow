import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from 'react-router-dom';
const ALL_TYPES = [
    { label: 'All Types', value: '' },
    { label: 'Tasks', value: 'TASK' },
    { label: 'Meetings', value: 'MEETING' },
    { label: 'Reminders', value: 'REMINDER' },
    { label: 'Deadlines', value: 'DEADLINE' },
    { label: 'Events', value: 'EVENT' },
];
const ALL_STATUSES = [
    { label: 'All Statuses', value: '' },
    { label: 'To Do', value: 'TODO' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Done', value: 'DONE' },
    { label: 'Cancelled', value: 'CANCELLED' },
];
const selectCls = 'bg-dark-bg border border-dark-border text-gray-400 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-500 cursor-pointer transition-colors hover:border-gray-600';
export const FiltersBar = ({ members, currentUserId }) => {
    const [params, setParams] = useSearchParams();
    const type = params.get('type') || '';
    const status = params.get('status') || '';
    const assigneeId = params.get('assigneeId') || '';
    const setFilter = (key, value) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value)
                next.set(key, value);
            else
                next.delete(key);
            return next;
        });
    };
    const hasFilters = !!(type || status || assigneeId);
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("select", { value: type, onChange: (e) => setFilter('type', e.target.value), className: selectCls, children: ALL_TYPES.map((t) => (_jsx("option", { value: t.value, children: t.label }, t.value))) }), _jsx("select", { value: status, onChange: (e) => setFilter('status', e.target.value), className: selectCls, children: ALL_STATUSES.map((s) => (_jsx("option", { value: s.value, children: s.label }, s.value))) }), _jsxs("select", { value: assigneeId, onChange: (e) => setFilter('assigneeId', e.target.value), className: selectCls, children: [_jsx("option", { value: "", children: "All Assignees" }), _jsx("option", { value: String(currentUserId), children: "Me" }), members
                        .filter((m) => m.userId !== currentUserId)
                        .map((m) => (_jsx("option", { value: String(m.userId), children: m.user.name }, m.userId)))] }), hasFilters && (_jsx("button", { onClick: () => setParams({}), className: "text-gray-600 hover:text-gray-300 text-sm transition-colors px-1", children: "\u2715 Clear" }))] }));
};
