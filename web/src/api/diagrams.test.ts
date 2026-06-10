import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './axios';
import { diagramApi } from './diagrams';

describe('diagram api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serializes review setup into the upload form payload', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(async (_url, payload) => {
      const formData = payload as FormData;
      expect(formData.get('reviewSetupJson')).toContain('"frameworkSelectionMode":"AutoDetect"');
      expect(formData.get('reviewSetupJson')).toContain('"businessDomain":"B2B SaaS"');

      return {
        data: {
          id: 'diagram-1',
          workspaceId: 'workspace-1',
          uploadedByUserId: 'user-1',
          name: 'Architecture Review',
          originalFileName: 'architecture-description.txt',
          description: 'React frontend and Azure API',
          uploadedAt: new Date().toISOString(),
          architectureScore: undefined,
          reviewSetup: {
            reviewContext: {
              businessDomain: 'B2B SaaS',
            },
            frameworkSelection: {
              mode: 'AutoDetect',
              confidenceScore: 0.8,
              requestedFrameworks: [],
              selectedFrameworks: ['AzureWellArchitected'],
              selectionRationale: ['Azure services detected.'],
            },
            qualityAttributeWeights: [
              { key: 'security', label: 'Security', weight: 25 },
              { key: 'availability', label: 'Availability', weight: 20 },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };
    });

    const response = await diagramApi.uploadDiagram({
      workspaceId: 'workspace-1',
      name: 'Architecture Review',
      description: 'React frontend and Azure API',
      reviewSetup: {
        businessDomain: 'B2B SaaS',
        targetUsers: 'External tenants',
        expectedTraffic: 'Moderate',
        dataSensitivity: 'PII',
        cloudProviderPreference: 'Azure',
        complianceNeeds: 'Audit logging',
        currentPainPoints: 'No monitoring',
        frameworkSelectionMode: 'AutoDetect',
        requestedFrameworks: [],
        qualityAttributeWeights: [
          { key: 'security', label: 'Security', weight: 25 },
          { key: 'availability', label: 'Availability', weight: 20 },
        ],
      },
    });

    expect(postSpy).toHaveBeenCalledOnce();
    expect(response.reviewSetup.frameworkSelection.mode).toBe('AutoDetect');
  });
});
