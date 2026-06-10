import { describe, expect, it, beforeEach } from 'vitest';
import Axios from 'axios';
import { apiClient, getErrorMessage, getFieldError } from './axios';

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

    const response = await apiClient.get('/api/workspaces', {
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

  it('prefers problem details messages and validation fields', () => {
    const error = new Axios.AxiosError(
      'Bad Request',
      '400',
      undefined,
      undefined,
      {
        data: {
          title: 'Validation failed',
          detail: 'Workspace name is required.',
          errors: {
            name: ['Workspace name is required.'],
          },
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
      },
    );

    expect(getErrorMessage(error)).toBe('Workspace name is required.');
    expect(getFieldError(error, 'name')).toBe('Workspace name is required.');
  });
});
