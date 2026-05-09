import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
export const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { signup } = useAuth();
    const nameRef = useRef(null);
    useEffect(() => { nameRef.current?.focus(); }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signup(email, password, name);
            navigate('/dashboard');
        }
        catch (err) {
            const msg = err
                ?.response?.data?.error?.message;
            setError(msg || 'Signup failed. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 }, children: _jsxs(AuthLayout, { title: "Create account", subtitle: "Join TaskFlow today", children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-400 text-sm", children: error })), _jsx(Input, { ref: nameRef, label: "Name", type: "text", placeholder: "Your name", value: name, onChange: (e) => setName(e.target.value), required: true, autoComplete: "name" }), _jsx(Input, { label: "Email", type: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, autoComplete: "email" }), _jsx(Input, { label: "Password", type: "password", placeholder: "Min. 8 characters", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 8, autoComplete: "new-password" }), _jsx(Button, { type: "submit", isLoading: isLoading, className: "mt-2", children: "Create Account" })] }), _jsx("div", { className: "mt-5 text-center", children: _jsxs("p", { className: "text-gray-500 text-sm", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "text-white hover:underline font-medium", children: "Sign in" })] }) })] }) }));
};
