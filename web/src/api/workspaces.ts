import { apiClient } from './axios';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  diagramCount: number;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export const workspaceApi = {
  async createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
    const response = await apiClient.post<Workspace>('/api/workspaces', {
      name: data.name,
    });
    return response.data;
  },

  async listWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get<Workspace[]>('/api/workspaces');
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
