import React from 'react';
import { Spinner } from './Spinner';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12">
      <Spinner size="lg" />
      <p className="mt-4 text-secondary-600 dark:text-secondary-300">{message}</p>
    </div>
  );
};

LoadingState.displayName = 'LoadingState';
