import { apiClient } from './axios';

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
}

export interface UploadDiagramRequest {
  organizationId: string;
  workspaceId: string;
  name: string;
  description?: string;
  file?: File;
}

export const diagramApi = {
  async uploadDiagram(data: UploadDiagramRequest): Promise<ArchitectureDiagram> {
    const formData = new FormData();
    formData.append('workspaceId', data.workspaceId);
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await apiClient.post<ArchitectureDiagram>(
      `/api/orgs/${data.organizationId}/workspaces/${data.workspaceId}/diagrams`,
      formData,
      {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      }
    );
    return response.data;
  },

  async listDiagrams(organizationId: string, workspaceId: string): Promise<ArchitectureDiagram[]> {
    const response = await apiClient.get<ArchitectureDiagram[]>(
      `/api/orgs/${organizationId}/workspaces/${workspaceId}/diagrams`
    );
    return response.data;
  },

  async getDiagram(organizationId: string, diagramId: string): Promise<ArchitectureDiagram> {
    const response = await apiClient.get<ArchitectureDiagram>(`/api/orgs/${organizationId}/diagrams/${diagramId}`);
    return response.data;
  },

  async deleteDiagram(diagramId: string): Promise<void> {
    await apiClient.delete(`/api/diagrams/${diagramId}`);
  },
};
