import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RoleBadge } from './RoleBadge';
export const BoardCard = ({ board }) => {
    const navigate = useNavigate();
    return (_jsxs(motion.div, { whileHover: { scale: 1.01 }, transition: { duration: 0.15 }, onClick: () => navigate(`/boards/${board.id}`), className: "bg-dark-surface border border-dark-border rounded-lg p-6 cursor-pointer hover:border-gray-600 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h3", { className: "text-white font-semibold text-lg leading-tight truncate pr-3", children: board.name }), _jsx(RoleBadge, { role: board.myRole })] }), board.description && (_jsx("p", { className: "text-gray-500 text-sm mb-4 line-clamp-2", children: board.description })), _jsxs("div", { className: "text-gray-600 text-xs mt-auto", children: [board.memberCount, " ", board.memberCount === 1 ? 'member' : 'members'] })] }));
};
