import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { boardApi } from '../lib/boardApi';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { DeleteBoardDialog } from '../components/DeleteBoardDialog';
import { Spinner } from '../components/Spinner';
export const BoardSettings = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [board, setBoard] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const nameRef = useRef(null);
    const boardId = parseInt(id);
    useEffect(() => {
        boardApi
            .get(boardId)
            .then((b) => {
            setBoard(b);
            setName(b.name);
            setDescription(b.description || '');
        })
            .catch(() => setError('Board not found or access denied'))
            .finally(() => setLoading(false));
    }, [boardId]);
    useEffect(() => {
        if (!loading)
            nameRef.current?.focus();
    }, [loading]);
    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setSaving(true);
        try {
            const updated = await boardApi.update(boardId, {
                name: name.trim(),
                description: description.trim() || undefined,
            });
            setBoard(updated);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2500);
        }
        catch (err) {
            const msg = err
                ?.response?.data?.error?.message;
            setError(msg || 'Failed to save changes');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        await boardApi.delete(boardId);
        navigate('/dashboard');
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-black flex items-center justify-center", children: _jsx(Spinner, { size: 24, className: "text-gray-500" }) }));
    }
    if (error && !board) {
        return (_jsx("div", { className: "min-h-screen bg-black text-white flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-400 mb-4", children: error }), _jsx("button", { onClick: () => navigate('/dashboard'), className: "text-gray-500 hover:text-white text-sm transition-colors", children: "\u2190 Back to boards" })] }) }));
    }
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2 }, className: "min-h-screen bg-black text-white", children: [_jsxs("div", { className: "max-w-xl mx-auto px-4 py-10 sm:py-14", children: [_jsx("button", { onClick: () => navigate(`/boards/${boardId}`), className: "text-gray-500 hover:text-white text-sm mb-8 transition-colors", children: "\u2190 Back to board" }), _jsx("h1", { className: "text-2xl font-bold mb-8", children: "Board Settings" }), _jsxs("div", { className: "bg-dark-surface border border-dark-border rounded-xl p-6 mb-6", children: [_jsx("h2", { className: "text-white font-semibold mb-5", children: "General" }), _jsxs("form", { onSubmit: handleSave, children: [_jsx(Input, { ref: nameRef, label: "Board name", value: name, onChange: (e) => setName(e.target.value), maxLength: 100, required: true }), _jsxs("div", { className: "mb-5", children: [_jsxs("label", { className: "block text-sm font-medium text-white mb-2", children: ["Description ", _jsx("span", { className: "text-gray-500 font-normal", children: "(optional)" })] }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), maxLength: 500, rows: 3, className: "w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition resize-none" })] }), error && _jsx("p", { className: "text-red-400 text-sm mb-3", children: error }), success && _jsx("p", { className: "text-green-400 text-sm mb-3", children: "Changes saved." }), _jsx(Button, { type: "submit", isLoading: saving, children: "Save Changes" })] })] }), _jsxs("div", { className: "bg-dark-surface border border-red-900/40 rounded-xl p-6", children: [_jsx("h2", { className: "text-white font-semibold mb-2", children: "Danger Zone" }), _jsx("p", { className: "text-gray-500 text-sm mb-5", children: "Permanently delete this board and all its data. This cannot be undone." }), _jsx(Button, { variant: "danger", onClick: () => setDeleteOpen(true), className: "w-auto px-5 text-sm", children: "Delete Board" })] })] }), _jsx(DeleteBoardDialog, { open: deleteOpen, boardName: board?.name || '', onClose: () => setDeleteOpen(false), onConfirm: handleDelete })] }));
};
