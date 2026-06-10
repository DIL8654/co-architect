import { apiClient } from './axios';

export interface DiagramComment {
  id: string;
  diagramId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommentRequest {
  workspaceId: string;
  diagramId: string;
  content: string;
}

export const commentsApi = {
  async createComment(data: CreateCommentRequest): Promise<DiagramComment> {
    const response = await apiClient.post<DiagramComment>(
      `/api/workspaces/${data.workspaceId}/diagrams/${data.diagramId}/comments`,
      { content: data.content }
    );
    return response.data;
  },

  async getDiagramComments(workspaceId: string, diagramId: string): Promise<DiagramComment[]> {
    const response = await apiClient.get<DiagramComment[]>(
      `/api/workspaces/${workspaceId}/diagrams/${diagramId}/comments`
    );
    return response.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/diagrams/comments/${commentId}`);
  },
};
