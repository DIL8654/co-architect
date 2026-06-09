import React from 'react';
import { Card } from './Card';
import type { MissingControl } from '../api/analysis';

interface MissingComponentsSectionProps {
  controls: MissingControl[];
}

export const MissingComponentsSection = React.forwardRef<HTMLDivElement, MissingComponentsSectionProps>(
  ({ controls }, ref) => {
    if (controls.length === 0) {
      return (
        <Card ref={ref} header="Missing Components">
          <p className="py-4 text-center italic text-secondary-500 dark:text-secondary-400">No missing components detected</p>
        </Card>
      );
    }

    return (
      <Card ref={ref} header={`Missing Components (${controls.length})`}>
        <div className="space-y-3">
          {controls.map((control, idx) => (
            <div key={idx} className="rounded-xl border border-error-200 bg-error-50 p-3 dark:border-error-500/25 dark:bg-error-500/10">
              <h4 className="mb-1 text-sm font-semibold text-error-900 dark:text-error-100">{control.name}</h4>
              <p className="mb-2 text-sm text-error-800 dark:text-error-200">
                <strong>Impact:</strong> {control.impact}
              </p>
              <p className="text-sm text-error-800 dark:text-error-200">
                <strong>Recommendation:</strong> {control.recommendation}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  }
);

MissingComponentsSection.displayName = 'MissingComponentsSection';
