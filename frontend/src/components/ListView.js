import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, InboxIcon } from 'lucide-react';
import { ItemCard } from './ItemCard';
const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const STATUS_LABELS = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
};
export const ListView = ({ items, onItemClick, hasFilters, onClearFilters }) => {
    const [collapsed, setCollapsed] = useState(new Set(['CANCELLED']));
    const grouped = STATUS_ORDER.reduce((acc, s) => { acc[s] = items.filter((i) => i.status === s); return acc; }, { TODO: [], IN_PROGRESS: [], DONE: [], CANCELLED: [] });
    const toggle = (s) => setCollapsed((prev) => {
        const next = new Set(prev);
        next.has(s) ? next.delete(s) : next.add(s);
        return next;
    });
    // All items filtered away
    if (items.length === 0 && hasFilters) {
        return (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "flex flex-col items-center justify-center py-20 text-center", children: [_jsx("div", { className: "w-14 h-14 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center mb-4", children: _jsx(SlidersHorizontal, { size: 22, className: "text-gray-600" }) }), _jsx("h3", { className: "text-white font-semibold mb-1", children: "No items match these filters" }), _jsx("p", { className: "text-gray-600 text-sm mb-5", children: "Try adjusting or clearing your filters." }), onClearFilters && (_jsx("button", { onClick: onClearFilters, className: "text-gray-400 hover:text-white text-sm underline underline-offset-2 transition-colors", children: "Clear filters" }))] }));
    }
    // Truly empty board
    if (items.length === 0) {
        return (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "flex flex-col items-center justify-center py-20 text-center", children: [_jsx("div", { className: "w-14 h-14 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center mb-4", children: _jsx(InboxIcon, { size: 22, className: "text-gray-600" }) }), _jsx("h3", { className: "text-white font-semibold mb-1", children: "No items yet" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Create your first item using the button above." })] }));
    }
    return (_jsx("div", { className: "space-y-3", children: STATUS_ORDER.map((status) => {
            const group = grouped[status];
            const isCollapsed = collapsed.has(status);
            return (_jsxs("div", { className: "bg-dark-surface border border-dark-border rounded-xl overflow-hidden", children: [_jsxs("button", { onClick: () => toggle(status), className: "w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-300 font-medium text-sm", children: STATUS_LABELS[status] }), _jsx("span", { className: "text-gray-600 text-xs bg-dark-bg px-1.5 py-0.5 rounded", children: group.length })] }), _jsx("span", { className: "text-gray-700 text-xs", children: isCollapsed ? '▸' : '▾' })] }), _jsx(AnimatePresence, { initial: false, children: !isCollapsed && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.18 }, className: "overflow-hidden", children: group.length === 0 ? (_jsx("div", { className: "px-4 py-3 text-gray-700 text-sm italic border-t border-dark-border", children: "No items" })) : (_jsx(AnimatePresence, { children: group.map((item) => (_jsx(motion.div, { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.15 }, children: _jsx(ItemCard, { item: item, onClick: onItemClick }) }, item.id))) })) })) })] }, status));
        }) }));
};
