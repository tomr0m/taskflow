import { jsx as _jsx } from "react/jsx-runtime";
const accentStyle = {
    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
    color: 'var(--accent)',
    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
};
const grayscaleStyles = {
    LOW: 'text-gray-600',
    MEDIUM: 'text-gray-400',
    HIGH: 'text-amber-500',
};
const labels = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
};
export const PriorityBadge = ({ priority }) => {
    if (priority === 'URGENT') {
        return (_jsx("span", { className: "text-xs font-medium px-2 py-0.5 rounded", style: accentStyle, children: labels[priority] }));
    }
    return (_jsx("span", { className: `text-xs font-medium ${grayscaleStyles[priority]}`, children: labels[priority] }));
};
