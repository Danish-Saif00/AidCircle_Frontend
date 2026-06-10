import {API_URLS, ENV} from '../../config/env';
import {normalizeApiError} from '../../shared/utils/apiError';
import {tokenStorage} from '../storage/tokenStorage';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthResponseData,
  NormalizedApiError,
} from './apiTypes';

type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  auth?: boolean;
  skipRefresh?: boolean;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  body?: unknown;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object';
};

const isApiSuccessResponse = <TData>(
  value: unknown,
): value is ApiSuccessResponse<TData> => {
  return isObject(value) && value.success === true;
};

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  return isObject(value) && value.success === false;
};

const createUrl = (
  path: string,
  query?: Record<string, QueryValue>,
): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_URLS.ROOT}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};

const createApiError = (
  response: Response,
  payload: unknown,
): NormalizedApiError => {
  if (isApiErrorResponse(payload)) {
    return normalizeApiError(payload, response.status);
  }

  return {
    status: response.status,
    message: response.statusText || 'Request failed. Please try again.',
    details: [],
  };
};

const refreshSession = async (): Promise<AuthResponseData | null> => {
  const refreshToken = await tokenStorage.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, ENV.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URLS.ROOT}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({refreshToken}),
      signal: controller.signal,
    });

    const payload = await parseJsonSafely(response);

    if (!response.ok || !isApiSuccessResponse<AuthResponseData>(payload)) {
      await tokenStorage.clearTokens();
      return null;
    }

    if (!payload.data?.session) {
      await tokenStorage.clearTokens();
      return null;
    }

    await tokenStorage.saveSession(payload.data.session);

    return payload.data;
  } catch {
    await tokenStorage.clearTokens();
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const request = async <TData = undefined>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> => {
  const {
    auth = false,
    skipRefresh = false,
    query,
    body,
    headers,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, ENV.REQUEST_TIMEOUT_MS);

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    };

    if (auth) {
      const accessToken = await tokenStorage.getAccessToken();

      if (accessToken) {
        requestHeaders.Authorization = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(createUrl(path, query), {
      ...fetchOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await parseJsonSafely(response);

    if (response.status === 401 && auth && !skipRefresh) {
      const refreshed = await refreshSession();

      if (refreshed?.session?.accessToken) {
        return request<TData>(path, {
          ...options,
          skipRefresh: true,
        });
      }
    }

    if (!response.ok) {
      throw createApiError(response, payload);
    }

    if (!isApiSuccessResponse<TData>(payload)) {
      return undefined as TData;
    }

    return payload.data as TData;
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw {
        status: 0,
        message: 'Request timed out. Please check your connection.',
        code: 'REQUEST_TIMEOUT',
        details: [],
      } satisfies NormalizedApiError;
    }

    throw normalizeApiError(error);
  } finally {
    clearTimeout(timeout);
  }
};

export const apiClient = {
  get<TData = undefined>(
    path: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ): Promise<TData> {
    return request<TData>(path, {
      ...options,
      method: 'GET',
    });
  },

  post<TData = undefined>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ): Promise<TData> {
    return request<TData>(path, {
      ...options,
      method: 'POST',
      body,
    });
  },

  patch<TData = undefined>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ): Promise<TData> {
    return request<TData>(path, {
      ...options,
      method: 'PATCH',
      body,
    });
  },

  delete<TData = undefined>(
    path: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ): Promise<TData> {
    return request<TData>(path, {
      ...options,
      method: 'DELETE',
    });
  },
};