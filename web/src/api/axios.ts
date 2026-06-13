import axios from 'axios';

const configuredBaseUrl = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL_PROD ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5010'
  : import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5010';
const baseURL = configuredBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getRetryAfterSeconds(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const rawValue = error.response?.headers?.['retry-after'];
  if (!rawValue) {
    return undefined;
  }

  const headerValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const parsed = Number.parseInt(String(headerValue), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getProblemDetails(error: unknown): ApiProblemDetails | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const detail = error.response?.data;
  if (!detail || typeof detail !== 'object') {
    return undefined;
  }

  return detail as ApiProblemDetails;
}

export function getFieldError(error: unknown, field: string): string | undefined {
  const problem = getProblemDetails(error);
  if (!problem?.errors) {
    return undefined;
  }

  const directMatch = problem.errors[field];
  if (directMatch?.length) {
    return directMatch[0];
  }

  const caseInsensitiveKey = Object.keys(problem.errors).find((key) => key.toLowerCase() === field.toLowerCase());
  return caseInsensitiveKey ? problem.errors[caseInsensitiveKey]?.[0] : undefined;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const problem = getProblemDetails(error);
    if (problem) {
      const firstValidationError = problem.errors
        ? Object.values(problem.errors).flat().find((message) => typeof message === 'string' && message.trim())
        : undefined;

      if (firstValidationError) {
        return firstValidationError;
      }

      if (typeof problem.detail === 'string' && problem.detail.trim()) {
        return problem.detail;
      }

      if (typeof problem.title === 'string' && problem.title.trim()) {
        return problem.title;
      }
    }

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
