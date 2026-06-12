import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { frameworkSelectionApi } from '../api/frameworkSelection';
import { UploadDiagramPage } from './UploadDiagramPage';

vi.mock('../api/frameworkSelection', () => ({
  frameworkSelectionApi: {
    preview: vi.fn(),
  },
}));

vi.mock('../hooks/useDiagrams', () => ({
  useUploadDiagram: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

function renderPage(path = '/app/workspaces/workspace-1/diagrams/upload') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const router = createMemoryRouter(
    [
      {
        path: '/app/workspaces/:workspaceId/diagrams/upload',
        element: <UploadDiagramPage />,
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

describe('UploadDiagramPage', () => {
  beforeEach(() => {
    vi.mocked(frameworkSelectionApi.preview).mockReset();
    vi.mocked(frameworkSelectionApi.preview).mockResolvedValue({
      reviewContext: {},
      frameworkSelection: {
        mode: 'AutoDetect',
        confidenceScore: 0.9,
        requestedFrameworks: [],
        selectedFrameworks: ['AzureWellArchitected'],
        requestedStandards: [],
        selectedStandards: ['Iso27001'],
        selectionRationale: ['Azure service cues were detected.'],
      },
      qualityAttributeWeights: [],
    });
  });

  it('renders review criteria above architecture input with structured business domain selection', async () => {
    renderPage();

    await screen.findByText('Review Criteria');

    const reviewCriteria = screen.getByText('Review Criteria');
    const architectureInput = screen.getByText('Architecture Input');
    expect(reviewCriteria.compareDocumentPosition(architectureInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const domainSelect = screen.getByLabelText('Business Domain') as HTMLSelectElement;
    expect(domainSelect.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'SaaS' })).toBeTruthy();
    expect(screen.getByText('Additional Standards and Governance Criteria')).toBeTruthy();
    expect(screen.getAllByText('ISO 27001').length).toBeGreaterThan(0);
  });

  it('shows a red warning when weights exceed 100 percent', async () => {
    renderPage();
    await screen.findByText('Review Criteria');

    const securityWeight = screen.getByDisplayValue('25');
    fireEvent.change(securityWeight, { target: { value: '55' } });

    await waitFor(() => {
      expect(screen.getByText('Weights exceed 100%. Reduce one or more values before saving.')).toBeTruthy();
    });
    expect(screen.getByText('130%')).toBeTruthy();
  });
});
