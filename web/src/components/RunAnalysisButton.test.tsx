import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { analysisApi } from '../api/analysis';
import { RunAnalysisButton } from './RunAnalysisButton';

vi.mock('../api/analysis', () => ({
  analysisApi: {
    runAnalysis: vi.fn(),
  },
}));

const reviewSetup = {
  reviewContext: {
    businessDomain: 'SaaS',
    dataSensitivity: 'PII / regulated',
    complianceNeeds: 'GDPR',
  },
  frameworkSelection: {
    mode: 'Manual' as const,
    confidenceScore: 0.9,
    requestedFrameworks: ['AzureWellArchitected' as const],
    selectedFrameworks: ['AzureWellArchitected' as const],
    requestedStandards: ['Gdpr' as const],
    selectedStandards: ['Gdpr' as const],
    selectionRationale: ['Manual review setup.'],
  },
  qualityAttributeWeights: [
    { key: 'security', label: 'Security', weight: 50 },
    { key: 'compliance', label: 'Compliance', weight: 50 },
  ],
};

describe('RunAnalysisButton', () => {
  it('opens confirmation before calling the analysis API', async () => {
    vi.mocked(analysisApi.runAnalysis).mockResolvedValue({
      id: 'run-1',
      diagramId: 'diagram-1',
      status: 'Completed',
      executiveSummary: 'Done',
      openQuestions: [],
      criticNotes: [],
      foundryIqContext: {
        frameworkGuidanceItems: [],
        principleItems: [],
        tradeoffItems: [],
        complianceItems: [],
        adrTemplateItems: [],
        workspaceMemoryItems: [],
        relatedFindingItems: [],
        relatedAdrHistoryItems: [],
        citationRefs: [],
        workspaceMemory: {
          previousReviewSummaries: [],
          recurringFindings: [],
          priorRecommendations: [],
          recentComments: [],
          adrHistory: [],
          architectureEvolutionSummary: '',
        },
      },
      agentTrace: [],
      evidence: [],
      missingControls: [],
      recommendations: [],
      tradeoffs: [],
      dimensionMaturitySuggestions: [],
      reviewSetup,
      createdAt: '2026-06-12T00:00:00Z',
    });

    render(
      <MemoryRouter>
        <RunAnalysisButton workspaceId="workspace-1" diagramId="diagram-1" reviewSetup={reviewSetup} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run AI Analysis' }));

    expect(await screen.findByRole('heading', { name: 'Confirm criteria before agents run' })).toBeTruthy();
    expect(analysisApi.runAnalysis).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Start Analysis' }));

    await waitFor(() => {
      expect(analysisApi.runAnalysis).toHaveBeenCalledTimes(1);
    });
  });
});
