import { act, fireEvent, render, screen } from '@testing-library/react';
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
    let resolveAnalysis: ((value: any) => void) | null = null;
    vi.mocked(analysisApi.runAnalysis).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalysis = resolve;
        }) as any,
    );

    render(
      <MemoryRouter>
        <RunAnalysisButton workspaceId="workspace-1" diagramId="diagram-1" reviewSetup={reviewSetup} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run AI Analysis' }));

    expect(await screen.findByRole('heading', { name: 'Confirm criteria before agents run' })).toBeTruthy();
    expect(analysisApi.runAnalysis).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start Analysis' }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(analysisApi.runAnalysis).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('workflow-step-1').getAttribute('data-status')).toBe('active');

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
    });

    expect(screen.getByTestId('workflow-step-1').getAttribute('data-status')).toBe('completed');
    expect(screen.getByTestId('workflow-step-2').getAttribute('data-status')).toBe('active');

    await act(async () => {
      resolveAnalysis?.({
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
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('workflow-step-12').getAttribute('data-status')).toBe('completed');
  }, 10000);
});
