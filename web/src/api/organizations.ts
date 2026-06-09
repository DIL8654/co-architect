import { apiClient } from './axios';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'Reader' | 'Commenter' | 'Writer' | 'Owner';
  joinedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

export const organizationApi = {
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await apiClient.post<Organization>('/api/organizations', data);
    return response.data;
  },

  async listOrganizations(): Promise<Organization[]> {
    const response = await apiClient.get<Organization[]>('/api/organizations');
    return response.data;
  },

  async getOrganization(organizationId: string): Promise<Organization> {
    const response = await apiClient.get<Organization>(`/api/organizations/${organizationId}`);
    return response.data;
  },

  async checkSlugAvailable(slug: string): Promise<boolean> {
    try {
      const response = await apiClient.get<boolean>(`/api/organizations/slug/${slug}/available`);
      return response.data;
    } catch {
      return false;
    }
  },
};
