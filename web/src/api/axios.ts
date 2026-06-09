import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5010';
const baseURL = configuredBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (detail && typeof detail === 'object' && 'message' in detail) {
      return String(detail.message);
    }

    return error.message;
  }

  return error instanceof Error ? error.message : 'Unexpected error';
}
