import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, header, footer, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-secondary-200 bg-white/[0.88] shadow-sm backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-white/5 ${className}`}
        {...props}
      >
        {header && (
          <div className="border-b border-secondary-200 px-6 py-4 font-semibold text-secondary-950 dark:border-white/10 dark:text-white">
            {header}
          </div>
        )}
        <div className="px-6 py-4 text-secondary-700 dark:text-secondary-200">{children}</div>
        {footer && (
          <div className="border-t border-secondary-200 bg-secondary-50/80 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';
