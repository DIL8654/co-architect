import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import type { ArchitectureAnalysisResult, DimensionBreakdown } from '../api/analysis';
import { formatScoreBandLabel, getScoreBandMeta } from '../lib/scoreBands';

interface ArchitectureScoreCardProps {
  currentAnalysis: ArchitectureAnalysisResult;
  previousAnalysis?: ArchitectureAnalysisResult | null;
  showDimensions?: boolean;
}

interface DimensionConfig {
  key: string;
  label: string;
}

const DIMENSIONS: DimensionConfig[] = [
  { key: 'security', label: 'Security' },
  { key: 'availability', label: 'Availability' },
  { key: 'scalability', label: 'Scalability' },
  { key: 'operations', label: 'Operations' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'cost', label: 'Cost' },
  { key: 'maintainability', label: 'Maintainability' },
  { key: 'tenantisolation', label: 'Tenant Isolation' },
];

const normalizeDimension = (dimension: string) => dimension.toLowerCase().replace(/[^a-z]/g, '');

const getTrendMeta = (delta: number) => {
  if (delta > 0) {
    return { label: `Improved by +${delta.toFixed(1)}`, variant: 'success' as const };
  }

  if (delta < 0) {
    return { label: `Declined by ${delta.toFixed(1)}`, variant: 'error' as const };
  }

  return { label: 'No change', variant: 'primary' as const };
};

const getDimensionValue = (breakdowns: DimensionBreakdown[] | undefined, key: string) => {
  if (!breakdowns || breakdowns.length === 0) {
    return null;
  }

  return breakdowns.find((item) => normalizeDimension(item.dimension).includes(key));
};

const formatScore = (score?: number | null) => (score === null || score === undefined ? '—' : score.toFixed(1));

export const ArchitectureScoreCard = React.forwardRef<HTMLDivElement, ArchitectureScoreCardProps>(
  ({ currentAnalysis, previousAnalysis, showDimensions = true }, ref) => {
    const currentScore = currentAnalysis.finalScore ?? null;
    const previousScore = previousAnalysis?.finalScore ?? null;
    const bandMeta = getScoreBandMeta(currentScore ?? undefined, currentAnalysis.scoreBand);
    const scoreDelta = currentScore !== null && previousScore !== null ? currentScore - previousScore : null;
    const trendMeta = scoreDelta !== null ? getTrendMeta(scoreDelta) : null;
    const maxContribution = Math.max(...(currentAnalysis.dimensionBreakdowns?.map((item) => item.contribution) ?? [0]), 1);

    return (
      <Card ref={ref} header="Architecture Intelligence Score">
        <div className="space-y-6">
          <div className="grid gap-3">
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 dark:border-cyan-300/20 dark:bg-cyan-400/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Current Score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-bold text-primary-700 dark:text-cyan-100">{formatScore(currentScore)}</span>
                <span className="pb-1 text-sm font-medium text-secondary-500 dark:text-secondary-400">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">Architecture Intelligence Score</p>
              <p className="mt-2 text-[11px] font-medium text-secondary-500 dark:text-secondary-400">
                Calculated by application scoring code from AI-suggested maturity evidence.
              </p>
            </div>

            <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Score Band</p>
              <div className="mt-2">
                <Badge variant={bandMeta.variant}>{bandMeta.label}</Badge>
              </div>
              <p className="mt-3 text-xs text-secondary-600 dark:text-secondary-300">
                {currentAnalysis.status === 'Completed' ? 'Based on the latest completed analysis' : 'Waiting for a completed analysis run'}
              </p>
            </div>

            <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Improvement Trend</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold text-secondary-950 dark:text-white">
                  {trendMeta ? `${scoreDelta! > 0 ? '+' : ''}${scoreDelta!.toFixed(1)}` : '—'}
                </span>
                <span className="pb-1 text-sm font-medium text-secondary-500 dark:text-secondary-400">pts</span>
              </div>
              {trendMeta ? (
                <div className="mt-2">
                  <Badge variant={trendMeta.variant}>{trendMeta.label}</Badge>
                </div>
              ) : (
                <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">Run analysis again to compare against the previous score.</p>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Previous Score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold text-secondary-700 dark:text-secondary-200">{formatScore(previousScore)}</span>
                <span className="pb-1 text-sm font-medium text-secondary-500 dark:text-secondary-400">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">
                {previousScore === null ? 'No previous completed score is available yet.' : formatScoreBandLabel(previousAnalysis?.scoreBand) || 'Previous completed analysis'}
              </p>
            </div>

            <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Current Score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-bold text-secondary-950 dark:text-white">{formatScore(currentScore)}</span>
                <span className="pb-1 text-sm font-medium text-secondary-500 dark:text-secondary-400">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">
                {currentAnalysis.completedAt ? `Completed ${new Date(currentAnalysis.completedAt).toLocaleString()}` : 'Analysis still in progress or pending.'}
              </p>
            </div>
          </div>

          {showDimensions && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-secondary-950 dark:text-white">Dimension Scores</h4>
              <span className="text-xs text-secondary-500 dark:text-secondary-400">0-5 maturity scale</span>
            </div>

            {currentAnalysis.dimensionBreakdowns && currentAnalysis.dimensionBreakdowns.length > 0 ? (
              <div className="space-y-3">
                {DIMENSIONS.map((dimension) => {
                  const breakdown = getDimensionValue(currentAnalysis.dimensionBreakdowns, dimension.key);
                  const maturityPercent = breakdown ? Math.max(0, Math.min(100, (breakdown.maturity / 5) * 100)) : 0;
                  const contributionWidth = breakdown ? Math.max(0, Math.min(100, (breakdown.contribution / maxContribution) * 100)) : 0;

                  return (
                    <div key={dimension.key} className="rounded-xl border border-secondary-100 bg-secondary-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-secondary-950 dark:text-white">{dimension.label}</p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">{breakdown ? `Maturity ${breakdown.maturity}/5` : 'No score available'}</p>
                        </div>
                        <div className="shrink-0 text-right text-xs text-secondary-600 dark:text-secondary-300">
                          <div>{breakdown ? `${breakdown.contribution.toFixed(1)} pts` : '— pts'}</div>
                          <div>{breakdown ? `${breakdown.weight.toFixed(0)}% weight` : '— weight'}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 rounded-full bg-secondary-200 dark:bg-white/10">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                            style={{ width: `${maturityPercent}%` }}
                          />
                        </div>
                        <div className="h-1 rounded-full bg-secondary-200 dark:bg-white/10">
                          <div
                            className="h-1 rounded-full bg-success-500/70 transition-all duration-500"
                            style={{ width: `${contributionWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-secondary-200 bg-secondary-50 px-4 py-6 text-center text-sm text-secondary-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-secondary-400">
                Dimension scores will appear after the next analysis run.
              </p>
            )}
          </div>
          )}
        </div>
      </Card>
    );
  }
);

ArchitectureScoreCard.displayName = 'ArchitectureScoreCard';
