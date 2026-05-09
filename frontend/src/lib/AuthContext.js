import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './apiClient';
import { connectSocket, disconnectSocket } from './socket';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            fetchMe(savedToken);
        }
        else {
            setIsLoading(false);
        }
    }, []);
    const fetchMe = async (authToken) => {
        try {
            const response = await apiClient.get('/auth/me', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setUser(response.data.user);
            connectSocket(authToken);
        }
        catch {
            localStorage.removeItem('token');
            setToken(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    const login = async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { user: userData, token: newToken } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        connectSocket(newToken);
    };
    const signup = async (email, password, name) => {
        const response = await apiClient.post('/auth/signup', { email, password, name });
        const { user: userData, token: newToken } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        connectSocket(newToken);
    };
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        delete apiClient.defaults.headers.common['Authorization'];
        disconnectSocket();
    };
    return (_jsx(AuthContext.Provider, { value: { user, token, login, signup, logout, isLoading }, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
