import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { hasError: false }
        });
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.error('[TaskFlow] Uncaught error:', error);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4 text-center", children: [_jsx("div", { className: "text-5xl mb-2", children: "\u26A0" }), _jsx("h1", { className: "text-xl font-semibold", children: "Something went wrong" }), _jsx("p", { className: "text-gray-500 text-sm max-w-xs", children: "An unexpected error occurred. Try reloading the page." }), _jsx("button", { onClick: () => window.location.reload(), className: "mt-2 px-6 py-2 bg-white text-black rounded font-medium text-sm hover:bg-gray-100 transition", children: "Reload" })] }));
        }
        return this.props.children;
    }
}
