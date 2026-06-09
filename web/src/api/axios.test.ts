import { describe, expect, it, beforeEach } from 'vitest';
import { apiClient } from './axios';

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses the configured backend root', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5010');
  });

  it('does not attach auth or demo headers through the shared client', async () => {
    localStorage.setItem('accessToken', 'test-token-123');
    localStorage.setItem('demoRole', 'Commenter');

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
