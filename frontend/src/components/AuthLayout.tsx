import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white text-black font-bold text-lg mb-4">
            T
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-8 shadow-2xl">
          {children}
        </div>
        <p className="text-center mt-6 text-xs text-gray-700">TaskFlow — Team Project Management</p>
      </div>
    </div>
  );
};
