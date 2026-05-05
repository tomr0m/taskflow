import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'w-full px-4 py-2 rounded font-medium transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100',
    secondary: 'bg-dark-bg border border-dark-border text-white hover:border-gray-400',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? '...Loading' : children}
    </button>
  );
};
