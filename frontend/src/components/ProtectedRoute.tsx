import { useAuth } from '../lib/AuthContext';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from './Spinner';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner size={24} className="text-gray-500" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};
