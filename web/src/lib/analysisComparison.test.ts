import { describe, expect, it } from 'vitest';
import { buildAnalysisComparison, getReviewFreshness } from './analysisComparison';
import type { AnalysisRunTimelineItem } from '../api/analysis';

function createRun(overrides: Partial<AnalysisRunTimelineItem>): AnalysisRunTimelineItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    status: overrides.status ?? 'Completed',
    finalScore: overrides.finalScore ?? 60,
    scoreBand: overrides.scoreBand ?? 'Production Candidate',
    executiveSummary: overrides.executiveSummary ?? 'Summary',
    topFinding: overrides.topFinding ?? 'Monitoring gap',
    frameworks: overrides.frameworks ?? ['AzureWellArchitected'],
    createdAt: overrides.createdAt ?? '2026-06-10T10:00:00Z',
    completedAt: overrides.completedAt ?? '2026-06-10T10:05:00Z',
  };
}

describe('analysis comparison helpers', () => {
  it('computes score delta and changed finding across the latest two runs', () => {
    const result = buildAnalysisComparison([
      createRun({
        id: 'latest',
        finalScore: 72,
        topFinding: 'Secrets management missing',
        createdAt: '2026-06-10T10:00:00Z',
      }),
      createRun({
        id: 'previous',
        finalScore: 64,
        topFinding: 'Monitoring gap',
        createdAt: '2026-06-09T10:00:00Z',
      }),
    ]);

    expect(result).not.toBeNull();
    expect(result?.scoreDelta).toBe(8);
    expect(result?.topFindingChanged).toBe(true);
    expect(result?.latest.id).toBe('latest');
    expect(result?.previous?.id).toBe('previous');
  });

  it('marks a diagram as needing review when it is newer than the latest completed run', () => {
    const freshness = getReviewFreshness(
      '2026-06-10T12:00:00Z',
      createRun({
        completedAt: '2026-06-10T11:00:00Z',
      }),
      new Date('2026-06-10T13:00:00Z'),
    );

    expect(freshness).toBe('needs-review');
  });

  it('marks a completed review as aging after a week', () => {
    const freshness = getReviewFreshness(
      '2026-06-01T12:00:00Z',
      createRun({
        completedAt: '2026-06-01T12:30:00Z',
      }),
      new Date('2026-06-10T13:00:00Z'),
    );

    expect(freshness).toBe('aging');
  });
});
