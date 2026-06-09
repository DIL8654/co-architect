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
  organizationId: string;
  diagramId: string;
  content: string;
}

export const commentsApi = {
  async createComment(data: CreateCommentRequest): Promise<DiagramComment> {
    const response = await apiClient.post<DiagramComment>(
      `/api/orgs/${data.organizationId}/diagrams/${data.diagramId}/comments`,
      { content: data.content }
    );
    return response.data;
  },

  async getDiagramComments(organizationId: string, diagramId: string): Promise<DiagramComment[]> {
    const response = await apiClient.get<DiagramComment[]>(
      `/api/orgs/${organizationId}/diagrams/${diagramId}/comments`
    );
    return response.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/diagrams/comments/${commentId}`);
  },
};
