import Config from 'react-native-config';

const requiredEnv = (key: keyof typeof Config): string => {
  const value = Config[key];

  if (!value || String(value).trim().length === 0) {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }

  return String(value);
};

const apiBaseUrl = requiredEnv('API_BASE_URL').replace(/\/$/, '');
const apiVersionPath = requiredEnv('API_VERSION_PATH').replace(/\/$/, '');
const requestTimeoutMs = Number(Config.REQUEST_TIMEOUT_MS ?? 30000);

if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
  throw new Error('REQUEST_TIMEOUT_MS must be a positive number.');
}

export const ENV = {
  API_BASE_URL: apiBaseUrl,
  API_VERSION_PATH: apiVersionPath,
  REQUEST_TIMEOUT_MS: requestTimeoutMs,
} as const;

export const API_URLS = {
  BASE: ENV.API_BASE_URL,
  ROOT: `${ENV.API_BASE_URL}${ENV.API_VERSION_PATH}`,
  HEALTH: `${ENV.API_BASE_URL}/health`,
  SWAGGER: `${ENV.API_BASE_URL}/api-docs`,
  OPENAPI_JSON: `${ENV.API_BASE_URL}/api-docs.json`,
} as const;