import axios from 'axios';
import { toast } from './toast';

// Vite exposes env via import.meta.env — typed via vite/client
const API_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL
  || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network / timeout
      toast.error('Connection lost. Please check your network.');
      return Promise.reject(error);
    }

    const status: number = error.response.status;
    const message: string =
      error.response.data?.error?.message ||
      error.response.data?.message ||
      '';

    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status >= 400 && status < 500) {
      // 4xx — show server's message if available, otherwise generic
      toast.error(message || 'Request failed. Please check your input.');
    } else if (status >= 500) {
      toast.error('Something went wrong. Please try again.');
    }

    return Promise.reject(error);
  }
);
