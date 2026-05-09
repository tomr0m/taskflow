import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ItemTypeIcon } from './ItemTypeIcon';
import { PriorityBadge } from './PriorityBadge';
function formatDate(iso) {
    if (!iso)
        return null;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export const ItemCard = ({ item, onClick }) => {
    const start = formatDate(item.startDate);
    const end = formatDate(item.endDate);
    return (_jsxs("div", { onClick: () => onClick(item), className: "flex items-center gap-3 px-4 py-3 border-b border-dark-border hover:bg-dark-surface cursor-pointer transition-colors group", children: [_jsx("div", { className: "shrink-0 mt-0.5", children: _jsx(ItemTypeIcon, { type: item.type }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-white text-sm font-medium truncate", children: item.title }), item.description && (_jsx("div", { className: "text-gray-600 text-xs truncate mt-0.5", children: item.description }))] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0 ml-2", children: [(start || end) && (_jsx("span", { className: "text-gray-600 text-xs hidden sm:block", children: start && end ? `${start} – ${end}` : start || end })), _jsx(PriorityBadge, { priority: item.priority }), item.assignee && (_jsx("div", { title: item.assignee.name, className: "w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white shrink-0", children: item.assignee.name[0].toUpperCase() }))] })] }));
};
