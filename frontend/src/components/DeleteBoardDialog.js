import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
export const DeleteBoardDialog = ({ open, boardName, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);
    // Escape to close
    useEffect(() => {
        if (!open)
            return;
        const handler = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);
    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(AnimatePresence, { children: open && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/75", onClick: onClose }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: -8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.15 }, className: "relative bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl", children: [_jsx("h2", { className: "text-white font-semibold text-lg mb-2", children: "Delete Board" }), _jsxs("p", { className: "text-gray-400 text-sm mb-6", children: ["Are you sure you want to delete", ' ', _jsxs("span", { className: "text-white font-medium", children: ["\"", boardName, "\""] }), "?", ' ', "This cannot be undone."] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: onClose, className: "flex-1", children: "Cancel" }), _jsx(Button, { type: "button", variant: "danger", onClick: handleConfirm, isLoading: loading, className: "flex-1", children: "Delete" })] })] })] })) }));
};
