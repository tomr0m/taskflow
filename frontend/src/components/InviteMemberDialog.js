import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './Input';
import { Button } from './Button';
export const InviteMemberDialog = ({ open, onClose, onInvite, myRole }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('MEMBER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const emailRef = useRef(null);
    const roleOptions = myRole === 'OWNER' ? ['ADMIN', 'MEMBER', 'VIEWER'] : ['MEMBER', 'VIEWER'];
    // Auto-focus + Escape
    useEffect(() => {
        if (!open)
            return;
        setTimeout(() => emailRef.current?.focus(), 50);
        const handler = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);
    // Reset on close
    useEffect(() => {
        if (!open) {
            setEmail('');
            setRole('MEMBER');
            setError('');
        }
    }, [open]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onInvite(email.trim(), role);
            onClose();
        }
        catch (err) {
            const msg = err
                ?.response?.data?.error?.message;
            setError(msg || 'Failed to invite member');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(AnimatePresence, { children: open && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/75", onClick: onClose }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: -8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.15 }, className: "relative bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl", children: [_jsx("h2", { className: "text-white font-semibold text-lg mb-5", children: "Invite Member" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(Input, { ref: emailRef, label: "Email address", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "user@example.com", required: true, autoComplete: "email" }), _jsxs("div", { className: "mb-5", children: [_jsx("label", { className: "block text-sm font-medium text-white mb-2", children: "Role" }), _jsx("select", { value: role, onChange: (e) => setRole(e.target.value), className: "w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white focus:outline-none focus:border-gray-400 transition", children: roleOptions.map((r) => (_jsx("option", { value: r, children: r }, r))) })] }), error && _jsx("p", { className: "text-red-400 text-sm mb-4", children: error }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: onClose, className: "flex-1", children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: loading, className: "flex-1", children: "Invite" })] })] })] })] })) }));
};
