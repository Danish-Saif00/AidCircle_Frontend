import {apiClient} from './apiClient';
import type {
  NearbyEmergenciesQuery,
  NearbyUsersQuery,
  NearbyUser,
  Emergency,
  UpdateLocationRequest,
  UserLocation,
} from './apiTypes';

export const locationsApi = {
  getStatus(): Promise<unknown> {
    return apiClient.get('/locations');
  },

  getMe(): Promise<UserLocation | null> {
    return apiClient.get<UserLocation | null>('/locations/me', {
      auth: true,
    });
  },

  updateMe(payload: UpdateLocationRequest): Promise<UserLocation> {
    return apiClient.post<UserLocation>('/locations/me', payload, {
      auth: true,
    });
  },

  getNearbyUsers(query: NearbyUsersQuery): Promise<NearbyUser[]> {
    return apiClient.get<NearbyUser[]>('/locations/nearby-users', {
      auth: true,
      query,
    });
  },

  getNearbyEmergencies(query: NearbyEmergenciesQuery): Promise<Emergency[]> {
    return apiClient.get<Emergency[]>('/locations/nearby-emergencies', {
      auth: true,
      query,
    });
  },
};