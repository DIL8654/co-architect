import { apiClient } from './axios';

export interface InfraHealthCheck {
  name: string;
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
}

export interface InfraHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  checkedAt: string;
  checks: InfraHealthCheck[];
}

export const infraHealthApi = {
  async getInfraHealth(): Promise<InfraHealthResponse> {
    const response = await apiClient.get<InfraHealthResponse>('/api/infra-health');
    return response.data;
  },
};
