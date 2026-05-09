import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Spinner } from './Spinner';
export const Button = ({ children, variant = 'primary', isLoading = false, disabled, className = '', ...props }) => {
    const base = 'w-full px-4 py-2 rounded font-medium transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
    const variants = {
        primary: 'bg-white text-black hover:bg-gray-100',
        secondary: 'bg-dark-bg border border-dark-border text-white hover:border-gray-400',
        danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600',
    };
    return (_jsxs("button", { className: `${base} ${variants[variant]} ${className}`, disabled: isLoading || disabled, ...props, children: [isLoading && _jsx(Spinner, { size: 14 }), children] }));
};
