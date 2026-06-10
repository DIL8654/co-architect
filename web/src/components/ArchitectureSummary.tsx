import React, { useState } from 'react';

interface ArchitectureSummaryProps {
  description?: string;
}

export const ArchitectureSummary = React.forwardRef<HTMLDivElement, ArchitectureSummaryProps>(
  ({ description }, ref) => {
    const [expanded, setExpanded] = useState(false);
    const hasLongDescription = (description?.length ?? 0) > 220;

    return (
      <div ref={ref} className="max-w-5xl">
        {description ? (
          <div className="rounded-xl border border-secondary-200 bg-white/[0.72] px-4 py-3 text-sm leading-6 text-secondary-700 backdrop-blur-xl dark:border-white/10 dark:bg-[#080F1F]/70 dark:text-secondary-200">
            <p className={`whitespace-pre-wrap ${!expanded && hasLongDescription ? 'line-clamp-2' : ''}`}>
              {description}
            </p>
            {hasLongDescription && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-2 text-xs font-semibold text-primary-700 hover:text-primary-800 dark:text-cyan-200 dark:hover:text-cyan-100"
              >
                {expanded ? 'Show less' : 'Read full summary'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-secondary-500 dark:text-secondary-400">No architecture summary provided.</p>
        )}
      </div>
    );
  }
);

ArchitectureSummary.displayName = 'ArchitectureSummary';
