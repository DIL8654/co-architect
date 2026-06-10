import { apiClient } from './axios';
import type { DiagramReviewSetup } from './diagrams';

export interface EvidenceItem {
  summary: string;
  detail: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface AgentExecutionTrace {
  agentName: string;
  role: string;
  framework?: string;
  status: string;
  summary: string;
  highlights: string[];
  usedFoundry: boolean;
  startedAt: string;
  completedAt: string;
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
  executiveSummary: string;
  openQuestions: string[];
  criticNotes: string[];
  agentTrace: AgentExecutionTrace[];
  evidence: EvidenceItem[];
  missingControls: MissingControl[];
  recommendations: Recommendation[];
  tradeoffs: Tradeoff[];
  dimensionMaturitySuggestions: DimensionMaturitySuggestion[];
  finalScore?: number;
  scoreBand?: string;
  dimensionBreakdowns?: DimensionBreakdown[];
  reviewSetup: DiagramReviewSetup;
  createdAt: string;
  completedAt?: string;
}

export interface AnalysisRunTimelineItem {
  id: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  finalScore?: number;
  scoreBand?: string;
  executiveSummary: string;
  topFinding?: string;
  frameworks: string[];
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

  async runAnalysis(workspaceId: string, diagramId: string): Promise<ArchitectureAnalysisResult> {
    const response = await apiClient.post<ArchitectureAnalysisResult>(
      `/api/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs`,
      {}
    );
    return response.data;
  },

  async getAnalysisRun(workspaceId: string, diagramId: string, runId: string): Promise<ArchitectureAnalysisResult> {
    const response = await apiClient.get<ArchitectureAnalysisResult>(
      `/api/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs/${runId}`
    );
    return response.data;
  },

  async listAnalysisRuns(workspaceId: string, diagramId: string): Promise<AnalysisRunTimelineItem[]> {
    const response = await apiClient.get<AnalysisRunTimelineItem[]>(
      `/api/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs`
    );
    return response.data;
  },
};
