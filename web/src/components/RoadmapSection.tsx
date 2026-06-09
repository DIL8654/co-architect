import React from 'react';
import { Card } from './Card';
import type { Recommendation } from '../api/analysis';

interface RoadmapSectionProps {
  recommendations: Recommendation[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return 'bg-error-50 border-error-200 text-error-900';
    case 'High':
      return 'bg-warning-50 border-warning-200 text-warning-900';
    case 'Medium':
      return 'bg-primary-50 border-primary-200 text-primary-900';
    default:
      return 'bg-secondary-50 border-secondary-200 text-secondary-900';
  }
};

export const RoadmapSection = React.forwardRef<HTMLDivElement, RoadmapSectionProps>(
  ({ recommendations }, ref) => {
    if (recommendations.length === 0) {
      return (
        <Card ref={ref} header="Improvement Roadmap">
          <p className="text-secondary-500 italic text-center py-4">No recommendations at this time</p>
        </Card>
      );
    }

    return (
      <Card ref={ref} header={`Improvement Roadmap (${recommendations.length})`}>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`p-3 border rounded-lg ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-sm">{rec.title}</h4>
                <span className="text-xs font-semibold px-2 py-1 bg-white rounded opacity-75">
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm mb-2">{rec.description}</p>
              <p className="text-xs opacity-75">Estimated effort: {rec.estimatedEffort}</p>
            </div>
          ))}
        </div>
      </Card>
    );
  }
);

RoadmapSection.displayName = 'RoadmapSection';
