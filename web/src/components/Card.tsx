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
        className={`panel ${className}`}
        {...props}
      >
        {header && <div className="panel-header">{header}</div>}
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-footer">{footer}</div>}
      </div>
    );
  }
);

Card.displayName = 'Card';
