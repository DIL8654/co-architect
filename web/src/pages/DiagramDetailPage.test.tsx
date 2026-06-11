import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DiagramDetailPage } from './DiagramDetailPage';

vi.mock('../hooks/useDiagrams', () => ({
  useDiagram: () => ({
    data: {
      id: 'diagram-1',
      workspaceId: 'workspace-1',
      uploadedByUserId: 'user-1',
      name: 'Payments Architecture',
      originalFileName: 'payments.png',
      fileUrl: '/payments.png',
      description: 'A sample architecture description.',
      uploadedAt: '2026-06-11T10:00:00Z',
      reviewSetup: {
        reviewContext: {},
        frameworkSelection: {
          mode: 'AutoDetect',
          confidenceScore: 0.9,
          requestedFrameworks: [],
          selectedFrameworks: ['AzureWellArchitected', 'OwaspAsvs'],
          selectionRationale: ['Detected API and Azure service cues.'],
        },
        qualityAttributeWeights: [],
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../hooks/useAnalysis', () => ({
  useDiagramAnalysis: () => ({
    data: {
      id: 'run-1',
      diagramId: 'diagram-1',
      status: 'Completed',
      executiveSummary: 'The architecture is promising but needs stronger controls.',
      openQuestions: [],
      criticNotes: [],
      foundryIqContext: {
        frameworkGuidanceItems: [
          { id: 'f1', title: 'Azure Well-Architected summary', summary: 'Used for reliability and cost review.', sourceType: 'knowledge-base' },
        ],
        principleItems: [],
        tradeoffItems: [],
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
          architectureEvolutionSummary: 'One completed review exists.',
        },
      },
      agentTrace: [
        {
          agentName: 'Context Enrichment Agent',
          role: 'Gather context',
          status: 'Completed',
          summary: 'Loaded grounded architecture context.',
          highlights: [],
          grounding: { frameworkRefs: [], principleRefs: [], tradeoffRefs: [], historyRefs: [], citationRefs: [] },
          usedFoundry: false,
          startedAt: '2026-06-11T10:01:00Z',
          completedAt: '2026-06-11T10:02:00Z',
        },
      ],
      evidence: [],
      missingControls: [
        {
          name: 'API gateway missing',
          impact: 'External APIs need centralized ingress and policy enforcement.',
          recommendation: 'Introduce an API gateway.',
          grounding: { frameworkRefs: ['OwaspAsvs'], principleRefs: ['Security'], tradeoffRefs: [], historyRefs: [], citationRefs: [] },
        },
      ],
      recommendations: [
        {
          title: 'Add API gateway',
          description: 'Protect ingress and centralize policies.',
          priority: 'High',
          estimatedEffort: 'Medium',
          grounding: { frameworkRefs: ['OwaspAsvs'], principleRefs: ['Security'], tradeoffRefs: [], historyRefs: [], citationRefs: [] },
        },
      ],
      tradeoffs: [
        {
          scenario: 'Security vs usability',
          pros: ['More control'],
          cons: ['More setup'],
          grounding: { frameworkRefs: [], principleRefs: [], tradeoffRefs: ['Security vs usability'], historyRefs: [], citationRefs: [] },
        },
      ],
      dimensionMaturitySuggestions: [],
      finalScore: 64.2,
      scoreBand: 'ProductionCandidate',
      dimensionBreakdowns: [
        { dimension: 'Security', maturity: 3, weight: 25, contribution: 15 },
      ],
      reviewSetup: {
        reviewContext: {},
        frameworkSelection: {
          mode: 'AutoDetect',
          confidenceScore: 0.9,
          requestedFrameworks: [],
          selectedFrameworks: ['AzureWellArchitected', 'OwaspAsvs'],
          selectionRationale: ['Detected API and Azure service cues.'],
        },
        qualityAttributeWeights: [],
      },
      createdAt: '2026-06-11T10:00:00Z',
      completedAt: '2026-06-11T10:03:00Z',
    },
    refetch: vi.fn(),
  }),
  useAnalysisRuns: () => ({
    data: [
      {
        id: 'run-1',
        status: 'Completed',
        finalScore: 64.2,
        scoreBand: 'ProductionCandidate',
        executiveSummary: 'Completed run',
        frameworks: ['AzureWellArchitected', 'OwaspAsvs'],
        createdAt: '2026-06-11T10:00:00Z',
        completedAt: '2026-06-11T10:03:00Z',
      },
    ],
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useComments', () => ({
  useDiagramComments: () => ({ data: [], refetch: vi.fn() }),
  useCreateComment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useAdrs', () => ({
  useAdrs: () => ({ data: [], refetch: vi.fn() }),
  useGenerateAdr: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRegenerateAdr: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteAdr: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderPage(path = '/workspaces/workspace-1/diagrams/diagram-1') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const router = createMemoryRouter(
    [
      {
        path: '/workspaces/:workspaceId/diagrams/:diagramId',
        element: <DiagramDetailPage />,
      },
    ],
    { initialEntries: [path] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('DiagramDetailPage', () => {
  it('renders the single workbench tabs and visible score strip', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Payments Architecture' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Diagram' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Architecture Intelligence' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Findings/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Recommendations/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Trade-offs/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Analysis Runs/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Agent Workflow/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /ADRs/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Detailed Result' })).toBeNull();
    expect(screen.getAllByText('Production Candidate').length).toBeGreaterThan(0);
    expect(screen.getByText('64.2')).toBeTruthy();
  });
});
