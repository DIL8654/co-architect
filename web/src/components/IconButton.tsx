import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  variant?: 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, variant = 'secondary', size = 'md', className = '', disabled, ...props }, ref) => {
    const variantStyles = {
      secondary: 'border border-[#d7dce2] bg-white text-secondary-800 shadow-sm hover:bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.08] dark:text-secondary-100 dark:hover:bg-white/[0.12]',
      ghost: 'text-primary-700 hover:bg-primary-50 dark:text-cyan-200 dark:hover:bg-cyan-400/10',
      danger: 'bg-error-600 text-white shadow-sm hover:bg-error-700',
    };

    const sizeStyles = {
      sm: 'h-8 w-8',
      md: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        type="button"
        title={label}
        aria-label={label}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-[#060B16] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
