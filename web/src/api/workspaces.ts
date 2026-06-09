import { apiClient } from './axios';

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  diagramCount: number;
}

export interface CreateWorkspaceRequest {
  organizationId: string;
  name: string;
}

export const workspaceApi = {
  async createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
    const response = await apiClient.post<Workspace>(`/api/orgs/${data.organizationId}/workspaces`, {
      name: data.name,
    });
    return response.data;
  },

  async listWorkspaces(organizationId?: string): Promise<Workspace[]> {
    const response = organizationId
      ? await apiClient.get<Workspace[]>(`/api/orgs/${organizationId}/workspaces`)
      : await apiClient.get<Workspace[]>('/api/workspaces');
    return response.data;
  },

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const response = await apiClient.get<Workspace>(`/api/workspaces/${workspaceId}`);
    return response.data;
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await apiClient.delete(`/api/workspaces/${workspaceId}`);
  },
};
