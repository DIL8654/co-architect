import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', children, className = '', ...props }, ref) => {
    const variantStyles = {
      primary: 'bg-primary-100 text-primary-800 dark:bg-cyan-400/10 dark:text-cyan-200',
      secondary: 'bg-secondary-100 text-secondary-800 dark:bg-white/10 dark:text-secondary-200',
      success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500',
      warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
      error: 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-500',
    };

    return (
      <span
        ref={ref}
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
