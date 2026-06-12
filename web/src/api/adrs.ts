import { apiClient } from './axios';

export interface AdrVersion {
  id: string;
  versionNumber: number;
  title: string;
  status: string;
  frameworks: string[];
  standards: string[];
  date: string;
  context: string[];
  decision: string[];
  alternatives: string[];
  tradeoffs: string[];
  consequences: string[];
  risks: string[];
  groundedContext: string[];
  history: string[];
  markdown: string;
  html: string;
  createdAt: string;
}

export interface AdrVersionSummary {
  id: string;
  versionNumber: number;
  status: string;
  createdAt: string;
}

export interface AdrRecord {
  id: string;
  workspaceId: string;
  diagramId: string;
  title: string;
  status: string;
  latestVersionNumber: number;
  latestVersion?: AdrVersion | null;
  versions: AdrVersionSummary[];
  createdAt: string;
  updatedAt: string;
}

export const adrApi = {
  async list(workspaceId: string, diagramId: string): Promise<AdrRecord[]> {
    const response = await apiClient.get<AdrRecord[]>(`/api/workspaces/${workspaceId}/diagrams/${diagramId}/adrs`);
    return response.data;
  },
  async generate(workspaceId: string, diagramId: string): Promise<AdrRecord> {
    const response = await apiClient.post<AdrRecord>(`/api/workspaces/${workspaceId}/diagrams/${diagramId}/adrs`, {});
    return response.data;
  },
  async get(workspaceId: string, diagramId: string, adrId: string): Promise<AdrRecord> {
    const response = await apiClient.get<AdrRecord>(`/api/workspaces/${workspaceId}/diagrams/${diagramId}/adrs/${adrId}`);
    return response.data;
  },
  async regenerate(workspaceId: string, diagramId: string, adrId: string): Promise<AdrRecord> {
    const response = await apiClient.post<AdrRecord>(`/api/workspaces/${workspaceId}/diagrams/${diagramId}/adrs/${adrId}/versions`, {});
    return response.data;
  },
  async delete(workspaceId: string, diagramId: string, adrId: string): Promise<void> {
    await apiClient.delete(`/api/workspaces/${workspaceId}/diagrams/${diagramId}/adrs/${adrId}`);
  },
};
