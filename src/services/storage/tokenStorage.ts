import * as Keychain from 'react-native-keychain';

import type {AuthSession} from '../api/apiTypes';

const TOKEN_STORAGE_SERVICE = 'com.aidcircle.mobile.auth';
const TOKEN_STORAGE_USERNAME = 'aidcircle-session';

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
};

const isStoredAuthTokens = (value: unknown): value is StoredAuthTokens => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredAuthTokens>;

  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === 'string' &&
    candidate.refreshToken.length > 0 &&
    (typeof candidate.expiresAt === 'number' || candidate.expiresAt === null)
  );
};

export const tokenStorage = {
  async saveSession(session: AuthSession): Promise<void> {
    const tokens: StoredAuthTokens = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    };

    await Keychain.setGenericPassword(
      TOKEN_STORAGE_USERNAME,
      JSON.stringify(tokens),
      {
        service: TOKEN_STORAGE_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
  },

  async getTokens(): Promise<StoredAuthTokens | null> {
    const credentials = await Keychain.getGenericPassword({
      service: TOKEN_STORAGE_SERVICE,
    });

    if (!credentials) {
      return null;
    }

    try {
      const parsed = JSON.parse(credentials.password) as unknown;

      if (!isStoredAuthTokens(parsed)) {
        await this.clearTokens();
        return null;
      }

      return parsed;
    } catch {
      await this.clearTokens();
      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();

    return tokens?.accessToken ?? null;
  },

  async getRefreshToken(): Promise<string | null> {
    const tokens = await this.getTokens();

    return tokens?.refreshToken ?? null;
  },

  async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({
      service: TOKEN_STORAGE_SERVICE,
    });
  },

  async hasTokens(): Promise<boolean> {
    const tokens = await this.getTokens();

    return Boolean(tokens?.accessToken && tokens.refreshToken);
  },
};