import React from 'react';
import { Card } from './Card';

interface ArchitectureSummaryProps {
  description?: string;
}

export const ArchitectureSummary = React.forwardRef<HTMLDivElement, ArchitectureSummaryProps>(
  ({ description }, ref) => {
    return (
      <Card ref={ref} header="Architecture Summary">
        {description ? (
          <p className="whitespace-pre-wrap leading-relaxed text-secondary-700 dark:text-secondary-200">{description}</p>
        ) : (
          <p className="text-secondary-500 italic dark:text-secondary-400">No description provided</p>
        )}
      </Card>
    );
  }
);

ArchitectureSummary.displayName = 'ArchitectureSummary';
