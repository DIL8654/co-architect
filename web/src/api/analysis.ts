import { apiClient } from './axios';
import type { DiagramReviewSetup } from './diagrams';

export interface EvidenceItem {
  summary: string;
  detail: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  grounding: GroundingReferenceSet;
}

export interface AgentExecutionTrace {
  agentName: string;
  role: string;
  framework?: string;
  status: string;
  summary: string;
  highlights: string[];
  grounding: GroundingReferenceSet;
  usedFoundry: boolean;
  startedAt: string;
  completedAt: string;
}

export interface GroundingReferenceSet {
  frameworkRefs: string[];
  principleRefs: string[];
  tradeoffRefs: string[];
  historyRefs: string[];
  citationRefs: string[];
}

export interface FoundryIqContextItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  sourceType: string;
  sourceLabel: string;
  sourceUri?: string;
  workspaceScoped: boolean;
  framework?: string;
  principle?: string;
  tradeoffTag?: string;
  adrId?: string;
  analysisRunId?: string;
}

export interface WorkspaceMemorySnapshot {
  previousReviewSummaries: string[];
  recurringFindings: string[];
  priorRecommendations: string[];
  recentComments: string[];
  adrHistory: string[];
  architectureEvolutionSummary: string;
}

export interface FoundryIqContextBundle {
  frameworkGuidanceItems: FoundryIqContextItem[];
  principleItems: FoundryIqContextItem[];
  tradeoffItems: FoundryIqContextItem[];
  adrTemplateItems: FoundryIqContextItem[];
  workspaceMemoryItems: FoundryIqContextItem[];
  relatedFindingItems: FoundryIqContextItem[];
  relatedAdrHistoryItems: FoundryIqContextItem[];
  citationRefs: string[];
  workspaceMemory: WorkspaceMemorySnapshot;
}

export interface MissingControl {
  name: string;
  impact: string;
  recommendation: string;
  grounding: GroundingReferenceSet;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedEffort: string;
  grounding: GroundingReferenceSet;
}

export interface Tradeoff {
  scenario: string;
  pros: string[];
  cons: string[];
  grounding: GroundingReferenceSet;
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
  foundryIqContext: FoundryIqContextBundle;
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

const EMPTY_GROUNDING: GroundingReferenceSet = {
  frameworkRefs: [],
  principleRefs: [],
  tradeoffRefs: [],
  historyRefs: [],
  citationRefs: [],
};

const EMPTY_CONTEXT: FoundryIqContextBundle = {
  frameworkGuidanceItems: [],
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
    architectureEvolutionSummary: 'No Foundry IQ context has been captured for this analysis yet.',
  },
};

function normalizeGrounding(grounding?: Partial<GroundingReferenceSet> | null): GroundingReferenceSet {
  return {
    frameworkRefs: grounding?.frameworkRefs ?? [],
    principleRefs: grounding?.principleRefs ?? [],
    tradeoffRefs: grounding?.tradeoffRefs ?? [],
    historyRefs: grounding?.historyRefs ?? [],
    citationRefs: grounding?.citationRefs ?? [],
  };
}

function normalizeAnalysisResult(result: ArchitectureAnalysisResult): ArchitectureAnalysisResult {
  return {
    ...result,
    foundryIqContext: result.foundryIqContext ?? EMPTY_CONTEXT,
    agentTrace: (result.agentTrace ?? []).map((item) => ({ ...item, grounding: normalizeGrounding(item.grounding) })),
    evidence: (result.evidence ?? []).map((item) => ({ ...item, grounding: normalizeGrounding(item.grounding) })),
    missingControls: (result.missingControls ?? []).map((item) => ({ ...item, grounding: normalizeGrounding(item.grounding) })),
    recommendations: (result.recommendations ?? []).map((item) => ({ ...item, grounding: normalizeGrounding(item.grounding) })),
    tradeoffs: (result.tradeoffs ?? []).map((item) => ({ ...item, grounding: normalizeGrounding(item.grounding) })),
  };
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
      return normalizeAnalysisResult(response.data);
    } catch (error) {
      return null;
    }
  },

  async runAnalysis(workspaceId: string, diagramId: string): Promise<ArchitectureAnalysisResult> {
    const response = await apiClient.post<ArchitectureAnalysisResult>(
      `/api/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs`,
      {}
    );
    return normalizeAnalysisResult(response.data);
  },

  async getAnalysisRun(workspaceId: string, diagramId: string, runId: string): Promise<ArchitectureAnalysisResult> {
    const response = await apiClient.get<ArchitectureAnalysisResult>(
      `/api/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs/${runId}`
    );
    return normalizeAnalysisResult(response.data);
  },

  async listAnalysisRuns(workspaceId: string, diagramId: string): Promise<AnalysisRunTimelineItem[]> {
    const response = await apiClient.get<AnalysisRunTimelineItem[]>(
      `/api/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs`
    );
    return response.data;
  },
};
