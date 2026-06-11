import { describe, expect, it } from 'vitest';
import { formatScoreBandLabel, getScoreBandMeta } from './scoreBands';

describe('scoreBands', () => {
  it('formats compact score band labels for human-readable UI', () => {
    expect(formatScoreBandLabel('ProductionCandidate')).toBe('Production Candidate');
    expect(formatScoreBandLabel('Production Ready')).toBe('Production Ready');
  });

  it('returns the expected metadata for formatted bands', () => {
    expect(getScoreBandMeta(64.2, 'ProductionCandidate')).toEqual({
      label: 'Production Candidate',
      variant: 'primary',
    });
  });
});
