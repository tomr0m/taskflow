import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { boardApi } from '../lib/boardApi';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
export const CreateBoard = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const nameRef = useRef(null);
    useEffect(() => { nameRef.current?.focus(); }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const board = await boardApi.create({
                name: name.trim(),
                description: description.trim() || undefined,
            });
            navigate(`/boards/${board.id}`);
        }
        catch (err) {
            const msg = err
                ?.response?.data?.error?.message;
            setError(msg || 'Failed to create board');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2 }, className: "min-h-screen bg-black text-white flex items-center justify-center px-4 py-10", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsx("button", { onClick: () => navigate('/dashboard'), className: "text-gray-500 hover:text-white text-sm mb-8 transition-colors flex items-center gap-1", children: "\u2190 Back to boards" }), _jsx("h1", { className: "text-2xl font-bold mb-8", children: "New Board" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(Input, { ref: nameRef, label: "Board name", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Product Roadmap", maxLength: 100, required: true }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-medium text-white mb-2", children: ["Description ", _jsx("span", { className: "text-gray-500 font-normal", children: "(optional)" })] }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "What is this board for?", maxLength: 500, rows: 3, className: "w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition resize-none" })] }), error && _jsx("p", { className: "text-red-400 text-sm mb-4", children: error }), _jsx(Button, { type: "submit", isLoading: loading, children: "Create Board" })] })] }) }));
};
