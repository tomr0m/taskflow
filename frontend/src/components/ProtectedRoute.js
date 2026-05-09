import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { Spinner } from './Spinner';
export const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-black flex items-center justify-center", children: _jsx(Spinner, { size: 24, className: "text-gray-500" }) }));
    }
    return user ? _jsx(_Fragment, { children: children }) : _jsx(Navigate, { to: "/login" });
};
