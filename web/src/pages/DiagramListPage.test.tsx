import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DiagramListPage } from './DiagramListPage';

vi.mock('../hooks/useDiagrams', () => ({
  useDiagrams: () => ({
    data: [
      {
        id: 'diagram-1',
        workspaceId: 'workspace-1',
        uploadedByUserId: 'user-1',
        name: 'Payments Architecture',
        originalFileName: 'payments.png',
        uploadedAt: '2026-06-11T10:00:00Z',
        architectureScore: undefined,
        reviewSetup: {
          reviewContext: {},
          frameworkSelection: {
            mode: 'AutoDetect',
            confidenceScore: 0.9,
            requestedFrameworks: [],
            selectedFrameworks: [],
            requestedStandards: [],
            selectedStandards: [],
            selectionRationale: [],
          },
          qualityAttributeWeights: [],
        },
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useDeleteDiagram: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('DiagramListPage', () => {
  it('shows an empty score state without implying a failed score', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/workspaces/workspace-1/diagrams']}>
          <Routes>
            <Route path="/workspaces/:workspaceId/diagrams" element={<DiagramListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('—')).toBeTruthy();
  });
});
