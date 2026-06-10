import {apiClient} from './apiClient';
import type {
  AdminUpdateUserRequest,
  IdResponse,
  PublicUserProfile,
  UpdateProfileRequest,
  UserProfile,
  Uuid,
} from './apiTypes';

const encodeId = (id: Uuid): string => encodeURIComponent(id);

export const usersApi = {
  getStatus(): Promise<unknown> {
    return apiClient.get('/users');
  },

  getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/me', {
      auth: true,
    });
  },

  updateMe(payload: UpdateProfileRequest): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/users/me', payload, {
      auth: true,
    });
  },

  deleteMe(): Promise<IdResponse> {
    return apiClient.delete<IdResponse>('/users/me', {
      auth: true,
      skipRefresh: true,
    });
  },

  getPublicProfile(userId: Uuid): Promise<PublicUserProfile> {
    return apiClient.get<PublicUserProfile>(`/users/${encodeId(userId)}`, {
      auth: true,
    });
  },

  adminListUsers(): Promise<UserProfile[]> {
    return apiClient.get<UserProfile[]>('/users/admin', {
      auth: true,
    });
  },

  adminUpdateUser(
    userId: Uuid,
    payload: AdminUpdateUserRequest,
  ): Promise<UserProfile> {
    return apiClient.patch<UserProfile>(
      `/users/admin/${encodeId(userId)}`,
      payload,
      {
        auth: true,
      },
    );
  },
};