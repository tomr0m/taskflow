import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { boardApi } from '../lib/boardApi';
import { BoardList } from '../components/BoardList';
import { Button } from '../components/Button';
import { SkeletonCard } from '../components/SkeletonCard';
export const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        boardApi
            .list()
            .then(setBoards)
            .catch(() => setError('Failed to load boards'))
            .finally(() => setLoading(false));
    }, []);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2 }, className: "min-h-screen bg-black text-white", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-10 sm:py-14", children: [_jsxs("div", { className: "flex items-center justify-between mb-10 gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-bold", children: "Boards" }), _jsxs("p", { className: "text-gray-500 text-sm mt-1", children: ["Welcome back, ", user?.name] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsxs(Button, { onClick: () => navigate('/boards/new'), className: "w-auto px-4 sm:px-5 text-sm", children: [_jsx(Plus, { size: 14 }), _jsx("span", { className: "hidden sm:inline", children: "New Board" }), _jsx("span", { className: "sm:hidden", children: "New" })] }), _jsxs(Button, { onClick: handleLogout, variant: "secondary", className: "w-auto px-3 sm:px-5 text-sm", title: "Logout", children: [_jsx(LogOut, { size: 14 }), _jsx("span", { className: "hidden sm:inline", children: "Logout" })] })] })] }), loading && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [1, 2, 3].map((i) => _jsx(SkeletonCard, {}, i)) })), error && !loading && (_jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [_jsx("p", { className: "text-red-400 mb-3", children: error }), _jsx(Button, { variant: "secondary", className: "w-auto px-6", onClick: () => { setError(''); setLoading(true); boardApi.list().then(setBoards).catch(() => setError('Failed to load boards')).finally(() => setLoading(false)); }, children: "Retry" })] })), !loading && !error && boards.length === 0 && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "flex flex-col items-center justify-center py-24 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-dark-surface border border-dark-border flex items-center justify-center mb-5", children: _jsx(LayoutGrid, { size: 28, className: "text-gray-600" }) }), _jsx("h2", { className: "text-white text-lg font-semibold mb-2", children: "No boards yet" }), _jsx("p", { className: "text-gray-500 text-sm mb-6", children: "Create your first board to get started." }), _jsxs(Button, { onClick: () => navigate('/boards/new'), className: "w-auto px-8", children: [_jsx(Plus, { size: 14 }), "Create Board"] })] })), !loading && boards.length > 0 && _jsx(BoardList, { boards: boards })] }) }));
};
