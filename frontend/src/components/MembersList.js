import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RoleBadge } from './RoleBadge';
const ROLE_OPTIONS = ['ADMIN', 'MEMBER', 'VIEWER'];
export const MembersList = ({ members, myRole, currentUserId, onChangeRole, onRemove, }) => {
    const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
    return (_jsx("div", { className: "space-y-2", children: members.map((m) => {
            const isSelf = m.userId === currentUserId;
            const isOwner = m.role === 'OWNER';
            const canEdit = canManage && !isOwner && !isSelf && myRole === 'OWNER';
            const canRemove = canManage &&
                !isOwner &&
                !isSelf &&
                (myRole === 'OWNER' || (myRole === 'ADMIN' && m.role !== 'ADMIN'));
            return (_jsxs("div", { className: "flex items-center justify-between bg-dark-bg border border-dark-border rounded-lg px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white shrink-0", children: m.user.name[0].toUpperCase() }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-white text-sm font-medium truncate", children: [m.user.name, " ", isSelf && _jsx("span", { className: "text-gray-500 font-normal", children: "(you)" })] }), _jsx("div", { className: "text-gray-500 text-xs truncate", children: m.user.email })] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0 ml-3", children: [canEdit && onChangeRole ? (_jsx("select", { value: m.role, onChange: (e) => onChangeRole(m.userId, e.target.value), className: "bg-dark-surface border border-dark-border text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-gray-400", children: ROLE_OPTIONS.map((r) => (_jsx("option", { value: r, children: r }, r))) })) : (_jsx(RoleBadge, { role: m.role })), canRemove && onRemove && (_jsx("button", { onClick: () => onRemove(m.userId), className: "text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1", children: "Remove" }))] })] }, m.id));
        }) }));
};
