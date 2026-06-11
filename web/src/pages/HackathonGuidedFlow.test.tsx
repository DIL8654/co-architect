import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analysisApi } from '../api/analysis';
import { diagramApi } from '../api/diagrams';
import { frameworkSelectionApi } from '../api/frameworkSelection';
import { workspaceApi } from '../api/workspaces';
import { SAMPLE_ARCHITECTURE_DESCRIPTION, SAMPLE_DIAGRAM_NAME } from '../lib/sampleArchitecture';
import { LandingPage } from './LandingPage';
import { UploadDiagramPage } from './UploadDiagramPage';

vi.mock('../api/workspaces', () => ({
  workspaceApi: {
    listWorkspaces: vi.fn(),
    createWorkspace: vi.fn(),
    getWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
  },
}));

vi.mock('../api/diagrams', () => ({
  diagramApi: {
    listDiagrams: vi.fn(),
    getDiagram: vi.fn(),
    uploadDiagram: vi.fn(),
    deleteDiagram: vi.fn(),
  },
}));

vi.mock('../api/analysis', () => ({
  analysisApi: {
    getDiagramAnalysis: vi.fn(),
    listAnalysisRuns: vi.fn(),
    runAnalysis: vi.fn(),
    getAnalysisRun: vi.fn(),
  },
}));

vi.mock('../api/frameworkSelection', () => ({
  frameworkSelectionApi: {
    preview: vi.fn(),
  },
}));

function renderWithRouter(initialPath: string, element: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter(
    [
      { path: '/', element },
      { path: '/workspaces/:workspaceId/diagrams/upload', element: <UploadDiagramPage /> },
    ],
    { initialEntries: [initialPath] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('hackathon guided flow', () => {
  beforeEach(() => {
    vi.mocked(workspaceApi.listWorkspaces).mockReset();
    vi.mocked(workspaceApi.createWorkspace).mockReset();
    vi.mocked(diagramApi.listDiagrams).mockReset();
    vi.mocked(analysisApi.getDiagramAnalysis).mockReset();
    vi.mocked(analysisApi.listAnalysisRuns).mockReset();
    vi.mocked(frameworkSelectionApi.preview).mockReset();
  });

  it('starts the sample flow by creating a workspace when none exists', async () => {
    vi.mocked(workspaceApi.listWorkspaces).mockResolvedValue([]);
    vi.mocked(workspaceApi.createWorkspace).mockRejectedValue(new Error('test stops before navigation'));

    renderWithRouter('/', <LandingPage />);

    await screen.findByText('Start Architecture Review');
    fireEvent.click(screen.getByRole('button', { name: 'Use Sample Architecture' }));

    await waitFor(() => {
      expect(workspaceApi.createWorkspace).toHaveBeenCalledWith({ name: 'Hackathon Architecture Review' });
    });
    expect(await screen.findByText('test stops before navigation')).toBeTruthy();
  });

  it('prefills the upload form when sample mode is requested', async () => {
    vi.mocked(frameworkSelectionApi.preview).mockResolvedValue({
      reviewContext: {},
      frameworkSelection: {
        mode: 'AutoDetect',
        confidenceScore: 0.9,
        requestedFrameworks: [],
        selectedFrameworks: ['AzureWellArchitected', 'Iso25010', 'OwaspAsvs'],
        selectionRationale: ['Azure and API security cues were detected.'],
      },
      qualityAttributeWeights: [],
    });

    renderWithRouter('/workspaces/workspace-1/diagrams/upload?sample=1', <UploadDiagramPage />);

    expect(await screen.findByDisplayValue(SAMPLE_DIAGRAM_NAME)).toBeTruthy();
    const description = screen.getByPlaceholderText('Describe the architecture, integrations, trust boundaries, constraints, and current gaps...') as HTMLTextAreaElement;
    expect(description.value).toBe(SAMPLE_ARCHITECTURE_DESCRIPTION);
    expect(screen.getByDisplayValue('B2B SaaS')).toBeTruthy();
  });
});
