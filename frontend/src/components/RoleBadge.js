import { jsx as _jsx } from "react/jsx-runtime";
const accentStyle = {
    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
    color: 'var(--accent)',
    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
};
const grayscaleStyles = {
    ADMIN: 'bg-gray-700 text-gray-100',
    MEMBER: 'bg-gray-800 text-gray-300',
    VIEWER: 'bg-gray-900 text-gray-500 border border-gray-700',
};
export const RoleBadge = ({ role }) => {
    if (role === 'OWNER') {
        return (_jsx("span", { className: "text-xs font-medium px-2 py-0.5 rounded", style: accentStyle, children: role }));
    }
    return (_jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded ${grayscaleStyles[role]}`, children: role }));
};
