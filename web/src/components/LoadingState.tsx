import React from 'react';
import { Spinner } from './Spinner';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Spinner size="lg" />
      <p className="text-secondary-600 mt-4">{message}</p>
    </div>
  );
};

LoadingState.displayName = 'LoadingState';
