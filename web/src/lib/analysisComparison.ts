import type { AnalysisRunTimelineItem } from '../api/analysis';

export interface AnalysisComparison {
  latest: AnalysisRunTimelineItem;
  previous: AnalysisRunTimelineItem | null;
  scoreDelta: number | null;
  topFindingChanged: boolean;
}

export type ReviewFreshness = 'fresh' | 'aging' | 'needs-review';

export function buildAnalysisComparison(runs: AnalysisRunTimelineItem[]): AnalysisComparison | null {
  if (!runs.length) {
    return null;
  }

  const latest = runs[0];
  const previous = runs[1] ?? null;
  const scoreDelta =
    latest.finalScore !== null &&
    latest.finalScore !== undefined &&
    previous?.finalScore !== null &&
    previous?.finalScore !== undefined
      ? latest.finalScore - previous.finalScore
      : null;

  return {
    latest,
    previous,
    scoreDelta,
    topFindingChanged: !!latest.topFinding && !!previous?.topFinding && latest.topFinding !== previous.topFinding,
  };
}

export function getReviewFreshness(
  uploadedAt: string,
  latestRun: AnalysisRunTimelineItem | null | undefined,
  now: Date = new Date(),
): ReviewFreshness {
  if (!latestRun?.completedAt) {
    return 'needs-review';
  }

  const uploadedTime = new Date(uploadedAt).getTime();
  const reviewedTime = new Date(latestRun.completedAt).getTime();

  if (reviewedTime < uploadedTime) {
    return 'needs-review';
  }

  const ageInDays = (now.getTime() - reviewedTime) / (1000 * 60 * 60 * 24);
  if (ageInDays > 7) {
    return 'aging';
  }

  return 'fresh';
}
