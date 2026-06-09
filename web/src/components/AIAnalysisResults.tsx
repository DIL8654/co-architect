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
          <p className="text-secondary-500 italic text-center py-4">No missing components detected</p>
        </Card>
      );
    }

    return (
      <Card ref={ref} header={`Missing Components (${controls.length})`}>
        <div className="space-y-3">
          {controls.map((control, idx) => (
            <div key={idx} className="p-3 border border-error-200 bg-error-50 rounded-lg">
              <h4 className="font-medium text-sm text-error-900 mb-1">{control.name}</h4>
              <p className="text-sm text-error-800 mb-2">
                <strong>Impact:</strong> {control.impact}
              </p>
              <p className="text-sm text-error-800">
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
