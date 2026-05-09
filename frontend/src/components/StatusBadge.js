import { jsx as _jsx } from "react/jsx-runtime";
const accentStyle = {
    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
    color: 'var(--accent)',
    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
};
const grayscaleStyles = {
    TODO: 'border border-gray-700 text-gray-500',
    IN_PROGRESS: 'border border-gray-500 text-gray-300',
    CANCELLED: 'border border-gray-800 text-gray-700',
};
const labels = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
};
export const StatusBadge = ({ status }) => {
    if (status === 'DONE') {
        return (_jsx("span", { className: "text-xs px-2 py-0.5 rounded font-medium", style: accentStyle, children: labels[status] }));
    }
    return (_jsx("span", { className: `text-xs px-2 py-0.5 rounded font-medium ${grayscaleStyles[status]}`, children: labels[status] }));
};
