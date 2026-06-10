import {apiClient} from './apiClient';
import type {
  AuthResponseData,
  AuthUser,
  IdResponse,
  LoginRequest,
  RefreshTokenRequest,
  SignupRequest,
  UserProfile,
} from './apiTypes';

export type AuthMeResponseData = {
  user: AuthUser;
  profile: UserProfile;
};

export const authApi = {
  getStatus(): Promise<unknown> {
    return apiClient.get('/auth');
  },

  signup(payload: SignupRequest): Promise<AuthResponseData> {
    return apiClient.post<AuthResponseData>('/auth/signup', payload);
  },

  login(payload: LoginRequest): Promise<AuthResponseData> {
    return apiClient.post<AuthResponseData>('/auth/login', payload);
  },

  refresh(payload: RefreshTokenRequest): Promise<AuthResponseData> {
    return apiClient.post<AuthResponseData>('/auth/refresh', payload, {
      skipRefresh: true,
    });
  },

  logout(): Promise<IdResponse> {
    return apiClient.post<IdResponse>(
      '/auth/logout',
      undefined,
      {
        auth: true,
        skipRefresh: true,
      },
    );
  },

  me(): Promise<AuthMeResponseData> {
    return apiClient.get<AuthMeResponseData>('/auth/me', {
      auth: true,
    });
  },
};