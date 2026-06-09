import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeStyles[size]} animate-spin rounded-full border-secondary-200 border-t-primary-600 dark:border-white/10 dark:border-t-cyan-300`}
    />
  );
};

Spinner.displayName = 'Spinner';
