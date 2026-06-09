import React from 'react';
import { HealthIcon } from './Icons';

export interface ErrorStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-error-200 bg-error-50/80 px-4 py-12 text-center dark:border-error-500/25 dark:bg-error-500/10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-200">
        <HealthIcon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-error-800 dark:text-error-100">{title}</h3>
      {message && <p className="mb-6 max-w-sm text-center text-error-700 dark:text-error-200">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
