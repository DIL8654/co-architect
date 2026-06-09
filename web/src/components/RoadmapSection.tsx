import React from 'react';
import { Card } from './Card';
import type { Recommendation } from '../api/analysis';

interface RoadmapSectionProps {
  recommendations: Recommendation[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return 'bg-error-50 border-error-200 text-error-900 dark:bg-error-500/10 dark:border-error-500/25 dark:text-error-100';
    case 'High':
      return 'bg-warning-50 border-warning-200 text-warning-900 dark:bg-warning-500/10 dark:border-warning-500/25 dark:text-warning-500';
    case 'Medium':
      return 'bg-primary-50 border-primary-200 text-primary-900 dark:bg-cyan-400/10 dark:border-cyan-300/20 dark:text-cyan-100';
    default:
      return 'bg-secondary-50 border-secondary-200 text-secondary-900 dark:bg-white/[0.04] dark:border-white/10 dark:text-secondary-100';
  }
};

export const RoadmapSection = React.forwardRef<HTMLDivElement, RoadmapSectionProps>(
  ({ recommendations }, ref) => {
    if (recommendations.length === 0) {
      return (
        <Card ref={ref} header="Improvement Roadmap">
          <p className="py-4 text-center italic text-secondary-500 dark:text-secondary-400">No recommendations at this time</p>
        </Card>
      );
    }

    return (
      <Card ref={ref} header={`Improvement Roadmap (${recommendations.length})`}>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`rounded-xl border p-3 ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-sm">{rec.title}</h4>
                <span className="rounded bg-white px-2 py-1 text-xs font-semibold opacity-75 dark:bg-white/10">
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
