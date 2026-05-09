import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { boardApi } from '../lib/boardApi';
import { BoardWorkspace } from '../components/BoardWorkspace';
import { Spinner } from '../components/Spinner';
export const BoardDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const boardId = parseInt(id);
    useEffect(() => {
        boardApi
            .get(boardId)
            .then(setBoard)
            .catch(() => setError('Board not found or access denied'))
            .finally(() => setLoading(false));
    }, [boardId]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-black flex items-center justify-center", children: _jsx(Spinner, { size: 24, className: "text-gray-500" }) }));
    }
    if (error || !board) {
        return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "min-h-screen bg-black text-white flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-400 mb-4", children: error || 'Board not found' }), _jsx("button", { onClick: () => navigate('/dashboard'), className: "text-gray-500 hover:text-white text-sm transition-colors", children: "\u2190 Back to boards" })] }) }));
    }
    return _jsx(BoardWorkspace, { initialBoard: board, currentUser: user });
};
