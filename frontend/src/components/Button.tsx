import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const base =
    'w-full px-4 py-2 rounded font-medium transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100',
    secondary: 'bg-dark-bg border border-dark-border text-white hover:border-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Spinner size={14} />}
      {children}
    </button>
  );
};
