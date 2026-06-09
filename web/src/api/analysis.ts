import { apiClient } from './axios';

export interface EvidenceItem {
  summary: string;
  detail: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface MissingControl {
  name: string;
  impact: string;
  recommendation: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedEffort: string;
}

export interface Tradeoff {
  scenario: string;
  pros: string[];
  cons: string[];
}

export interface DimensionMaturitySuggestion {
  dimension: string;
  currentMaturity: number;
  suggestedMaturity: number;
  justification: string;
}

export interface DimensionBreakdown {
  dimension: string;
  maturity: number;
  weight: number;
  contribution: number;
}

export interface ArchitectureAnalysisResult {
  id: string;
  diagramId: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  evidence: EvidenceItem[];
  missingControls: MissingControl[];
  recommendations: Recommendation[];
  tradeoffs: Tradeoff[];
  dimensionMaturitySuggestions: DimensionMaturitySuggestion[];
  finalScore?: number;
  scoreBand?: string;
  dimensionBreakdowns?: DimensionBreakdown[];
  createdAt: string;
  completedAt?: string;
}

export const analysisApi = {
  async getDiagramAnalysis(diagramId: string): Promise<ArchitectureAnalysisResult | null> {
    try {
      const response = await apiClient.get<ArchitectureAnalysisResult>(`/api/diagrams/${diagramId}/analysis`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async runAnalysis(organizationId: string, diagramId: string): Promise<ArchitectureAnalysisResult> {
    const response = await apiClient.post<ArchitectureAnalysisResult>(
      `/api/orgs/${organizationId}/diagrams/${diagramId}/analysis-runs`,
      {}
    );
    return response.data;
  },

  async getAnalysisRun(organizationId: string, diagramId: string, runId: string): Promise<ArchitectureAnalysisResult> {
    const response = await apiClient.get<ArchitectureAnalysisResult>(
      `/api/orgs/${organizationId}/diagrams/${diagramId}/analysis-runs/${runId}`
    );
    return response.data;
  },
};
