import React from 'react';

export interface ErrorStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-error-50 rounded-lg">
      <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-error-800 mb-2">{title}</h3>
      {message && <p className="text-error-700 text-center mb-6 max-w-sm">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
