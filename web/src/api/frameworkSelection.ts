import { apiClient } from './axios';
import type { DiagramReviewSetup, DiagramReviewSetupInput } from './diagrams';

export interface FrameworkSelectionPreviewRequest {
  description?: string;
  reviewSetup: DiagramReviewSetupInput;
}

export const frameworkSelectionApi = {
  async preview(request: FrameworkSelectionPreviewRequest): Promise<DiagramReviewSetup> {
    const response = await apiClient.post<DiagramReviewSetup>('/api/framework-selection/preview', request);
    return response.data;
  },
};
