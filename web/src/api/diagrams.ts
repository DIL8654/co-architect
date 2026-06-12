import { apiClient } from './axios';

export type FrameworkSelectionMode = 'AutoDetect' | 'Manual';
export type ReviewFramework =
  | 'AzureWellArchitected'
  | 'AwsWellArchitected'
  | 'Iso25010'
  | 'OwaspAsvs';
export type ReviewStandard =
  | 'Iso27001'
  | 'Gdpr'
  | 'Soc2'
  | 'Togaf'
  | 'Safe';

export interface ReviewContext {
  businessDomain?: string;
  targetUsers?: string;
  expectedTraffic?: string;
  dataSensitivity?: string;
  cloudProviderPreference?: string;
  complianceNeeds?: string;
  currentPainPoints?: string;
}

export interface QualityAttributeWeight {
  key: string;
  label: string;
  weight: number;
}

export interface FrameworkSelectionSummary {
  mode: FrameworkSelectionMode;
  detectedCloudProvider?: string;
  confidenceScore: number;
  requestedFrameworks: ReviewFramework[];
  selectedFrameworks: ReviewFramework[];
  requestedStandards: ReviewStandard[];
  selectedStandards: ReviewStandard[];
  selectionRationale: string[];
}

export interface DiagramReviewSetup {
  reviewContext: ReviewContext;
  frameworkSelection: FrameworkSelectionSummary;
  qualityAttributeWeights: QualityAttributeWeight[];
}

export interface ArchitectureDiagram {
  id: string;
  workspaceId: string;
  uploadedByUserId: string;
  name: string;
  originalFileName: string;
  fileUrl?: string;
  description?: string;
  uploadedAt: string;
  architectureScore?: number;
  reviewSetup: DiagramReviewSetup;
}

export interface UploadDiagramRequest {
  workspaceId: string;
  name: string;
  description?: string;
  file?: File;
  reviewSetup: DiagramReviewSetupInput;
}

export interface DiagramReviewSetupInput {
  businessDomain?: string;
  targetUsers?: string;
  expectedTraffic?: string;
  dataSensitivity?: string;
  cloudProviderPreference?: string;
  complianceNeeds?: string;
  currentPainPoints?: string;
  frameworkSelectionMode: FrameworkSelectionMode;
  requestedFrameworks: ReviewFramework[];
  requestedStandards: ReviewStandard[];
  qualityAttributeWeights: QualityAttributeWeight[];
}

export const diagramApi = {
  async uploadDiagram(data: UploadDiagramRequest): Promise<ArchitectureDiagram> {
    const formData = new FormData();
    formData.append('workspaceId', data.workspaceId);
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('reviewSetupJson', JSON.stringify(data.reviewSetup));
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await apiClient.post<ArchitectureDiagram>(
      `/api/workspaces/${data.workspaceId}/diagrams`,
      formData,
      {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      }
    );
    return response.data;
  },

  async listDiagrams(workspaceId: string): Promise<ArchitectureDiagram[]> {
    const response = await apiClient.get<ArchitectureDiagram[]>(
      `/api/workspaces/${workspaceId}/diagrams`
    );
    return response.data;
  },

  async getDiagram(diagramId: string): Promise<ArchitectureDiagram> {
    const response = await apiClient.get<ArchitectureDiagram>(`/api/diagrams/${diagramId}`);
    return response.data;
  },

  async deleteDiagram(diagramId: string): Promise<void> {
    await apiClient.delete(`/api/diagrams/${diagramId}`);
  },
};
