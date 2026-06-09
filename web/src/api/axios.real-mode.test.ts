import { beforeEach, describe, expect, it } from 'vitest';

describe('api client local storage isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps requests header-free even when a token exists locally', async () => {
    const { apiClient } = await import('./axios');

    localStorage.setItem('accessToken', 'test-token-123');

    const response = await apiClient.get('/api/organizations', {
      adapter: async (config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        const headerNames = Object.keys(config.headers ?? {});
        expect(headerNames.some((header) => header.toLowerCase().startsWith('x-demo-'))).toBe(false);

        return {
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      },
    });

    expect(response.status).toBe(200);
  });
});
