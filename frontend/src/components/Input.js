import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Input = forwardRef(({ label, error, className, ...props }, ref) => {
    return (_jsxs("div", { className: "mb-4", children: [label && _jsx("label", { className: "block text-sm font-medium text-white mb-2", children: label }), _jsx("input", { ref: ref, className: `w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-400 transition ${className}`, ...props }), error && _jsx("p", { className: "text-red-500 text-sm mt-1", children: error })] }));
});
Input.displayName = 'Input';
