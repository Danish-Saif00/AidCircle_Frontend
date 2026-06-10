import type {
  ApiErrorDetail,
  ApiErrorResponse,
  NormalizedApiError,
} from '../../services/api/apiTypes';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiErrorResponse>;

  return candidate.success === false && typeof candidate.message === 'string';
};

export const isNormalizedApiError = (
  value: unknown,
): value is NormalizedApiError => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<NormalizedApiError>;

  return (
    typeof candidate.status === 'number' &&
    typeof candidate.message === 'string' &&
    Array.isArray(candidate.details)
  );
};

export const normalizeApiError = (
  error: unknown,
  fallbackStatus = 0,
): NormalizedApiError => {
  if (isNormalizedApiError(error)) {
    return error;
  }

  if (isApiErrorResponse(error)) {
    return {
      status: fallbackStatus,
      message: error.message || DEFAULT_ERROR_MESSAGE,
      code: error.error?.code,
      requestId: error.requestId,
      details: error.error?.details ?? [],
    };
  }

  if (error instanceof Error) {
    return {
      status: fallbackStatus,
      message: error.message || DEFAULT_ERROR_MESSAGE,
      details: [],
    };
  }

  if (typeof error === 'string') {
    return {
      status: fallbackStatus,
      message: error,
      details: [],
    };
  }

  return {
    status: fallbackStatus,
    message: DEFAULT_ERROR_MESSAGE,
    details: [],
  };
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
): string => {
  const normalized = normalizeApiError(error);

  return normalized.message || fallbackMessage;
};

export const getFieldError = (
  details: ApiErrorDetail[] | undefined,
  field: string,
): string | undefined => {
  return details?.find(detail => detail.field === field)?.message;
};

export const isUnauthorizedError = (error: unknown): boolean => {
  const normalized = normalizeApiError(error);

  return normalized.status === 401 || normalized.code === 'UNAUTHORIZED';
};

export const isRateLimitError = (error: unknown): boolean => {
  const normalized = normalizeApiError(error);

  return normalized.status === 429 || normalized.code === 'TOO_MANY_REQUESTS';
};

export const formatErrorForLog = (error: unknown) => {
  const normalized = normalizeApiError(error);

  return {
    status: normalized.status,
    code: normalized.code,
    message: normalized.message,
    requestId: normalized.requestId,
    details: normalized.details,
  };
};