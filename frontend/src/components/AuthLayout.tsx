import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-lg p-8 shadow-lg">
          {children}
        </div>
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>TaskFlow • Phase 1</p>
        </div>
      </div>
    </div>
  );
};
