import { apiClient } from './axios';

export interface AiFoundrySettings {
  projectEndpoint: string;
  agentId: string;
  modelDeployment: string;
  apiVersion: string;
  hasApiKey: boolean;
  apiKeyPreview?: string | null;
  updatedAt?: string | null;
}

export interface SaveAiFoundrySettingsRequest {
  projectEndpoint: string;
  agentId: string;
  modelDeployment: string;
  apiVersion?: string;
  apiKey?: string;
  clearApiKey?: boolean;
}

export async function getAiFoundrySettings(): Promise<AiFoundrySettings> {
  const response = await apiClient.get<AiFoundrySettings>('/api/settings/ai-foundry');
  return response.data;
}

export async function saveAiFoundrySettings(request: SaveAiFoundrySettingsRequest): Promise<AiFoundrySettings> {
  const response = await apiClient.put<AiFoundrySettings>('/api/settings/ai-foundry', request);
  return response.data;
}
