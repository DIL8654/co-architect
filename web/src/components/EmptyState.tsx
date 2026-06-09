import React from 'react';
import { SparkIcon } from './Icons';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-300 bg-white/70 px-4 py-12 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className="glow-icon mb-4 h-14 w-14">
        <SparkIcon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-secondary-950 dark:text-white">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-center text-secondary-600 dark:text-secondary-300">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
