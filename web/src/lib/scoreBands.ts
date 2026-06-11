export type ScoreBandVariant = 'success' | 'primary' | 'warning' | 'error';

export interface ScoreBandMeta {
  label: string;
  variant: ScoreBandVariant;
}

const SCORE_BANDS: Array<{ min: number; max: number; label: string; variant: ScoreBandVariant }> = [
  { min: 0, max: 30, label: 'High Risk', variant: 'error' },
  { min: 31, max: 50, label: 'Early MVP', variant: 'warning' },
  { min: 51, max: 70, label: 'Production Candidate', variant: 'primary' },
  { min: 71, max: 85, label: 'Production Ready', variant: 'success' },
  { min: 86, max: 100, label: 'Enterprise Ready', variant: 'success' },
];

const COMPACT_LABELS: Record<string, string> = {
  highrisk: 'High Risk',
  earlymvp: 'Early MVP',
  productioncandidate: 'Production Candidate',
  productionready: 'Production Ready',
  enterpriseready: 'Enterprise Ready',
};

export function formatScoreBandLabel(band?: string | null) {
  if (!band) {
    return '';
  }

  const normalized = band.toLowerCase().replace(/[^a-z]/g, '');
  return COMPACT_LABELS[normalized] ?? band.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

export function getScoreBandMeta(score?: number | null, band?: string | null): ScoreBandMeta {
  const formattedBand = formatScoreBandLabel(band);

  if (formattedBand) {
    const normalizedBand = formattedBand.toLowerCase().replace(/[^a-z]/g, '');
    if (normalizedBand.includes('enterprise')) return { label: 'Enterprise Ready', variant: 'success' };
    if (normalizedBand.includes('productionready')) return { label: 'Production Ready', variant: 'success' };
    if (normalizedBand.includes('productioncandidate')) return { label: 'Production Candidate', variant: 'primary' };
    if (normalizedBand.includes('earlymvp')) return { label: 'Early MVP', variant: 'warning' };
    if (normalizedBand.includes('highrisk')) return { label: 'High Risk', variant: 'error' };
  }

  const matchedBand = SCORE_BANDS.find((item) => (score ?? 0) >= item.min && (score ?? 0) <= item.max);
  return matchedBand ?? { label: 'Unknown', variant: 'primary' };
}
