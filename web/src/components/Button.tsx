import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, disabled, icon, className = '', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-[#060B16]';

    const variantStyles = {
      primary: 'bg-primary-600 text-white shadow-[0_10px_28px_rgba(37,99,235,0.20)] hover:bg-primary-700 dark:bg-cyan-500 dark:text-[#06111F] dark:hover:bg-cyan-400 dark:shadow-[0_0_28px_rgba(34,211,238,0.18)]',
      secondary: 'border border-secondary-200 bg-white text-secondary-800 shadow-sm hover:bg-secondary-50 dark:border-white/10 dark:bg-white/[0.08] dark:text-secondary-100 dark:hover:bg-white/[0.12]',
      danger: 'bg-error-600 text-white shadow-[0_10px_28px_rgba(220,38,38,0.16)] hover:bg-error-700',
      ghost: 'text-primary-700 hover:bg-primary-50 dark:text-cyan-200 dark:hover:bg-cyan-400/10',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? <Spinner size="sm" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
