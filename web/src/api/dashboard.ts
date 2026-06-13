import { apiClient } from './axios';

export interface WorkspaceDashboardSummary {
  id: string;
  name: string;
  diagramCount: number;
  scoredDiagramCount: number;
  needsReviewCount: number;
}

export interface DemoJourneySummary {
  workspaceId: string;
  workspaceName: string;
  diagramId: string;
  diagramName: string;
  description: string;
  thumbnailUrl?: string;
  score: number | null;
  analysisStatus: string;
  latestRunId?: string;
  adrCount: number;
}

export interface DashboardSummary {
  workspaceCount: number;
  diagramCount: number;
  scoredDiagramCount: number;
  needsReviewCount: number;
  workspaceSummaries: WorkspaceDashboardSummary[];
  demoJourneys: DemoJourneySummary[];
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/api/dashboard/summary');
    return response.data;
  },
};
