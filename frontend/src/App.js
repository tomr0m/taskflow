import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/Toaster';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { CreateBoard } from './pages/CreateBoard';
import { BoardDetail } from './pages/BoardDetail';
import { BoardSettings } from './pages/BoardSettings';
function AnimatedRoutes() {
    const location = useLocation();
    return (_jsx(AnimatePresence, { mode: "wait", initial: false, children: _jsxs(Routes, { location: location, children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/signup", element: _jsx(Signup, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/boards/new", element: _jsx(ProtectedRoute, { children: _jsx(CreateBoard, {}) }) }), _jsx(Route, { path: "/boards/:id", element: _jsx(ProtectedRoute, { children: _jsx(BoardDetail, {}) }) }), _jsx(Route, { path: "/boards/:id/settings", element: _jsx(ProtectedRoute, { children: _jsx(BoardSettings, {}) }) })] }, location.pathname) }));
}
function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(BrowserRouter, { children: _jsxs(AuthProvider, { children: [_jsx(AnimatedRoutes, {}), _jsx(Toaster, {})] }) }) }));
}
export default App;
