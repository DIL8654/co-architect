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
          <p className="text-secondary-700 leading-relaxed whitespace-pre-wrap">{description}</p>
        ) : (
          <p className="text-secondary-500 italic">No description provided</p>
        )}
      </Card>
    );
  }
);

ArchitectureSummary.displayName = 'ArchitectureSummary';
