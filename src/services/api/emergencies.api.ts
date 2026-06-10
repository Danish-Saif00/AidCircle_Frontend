import {apiClient} from './apiClient';
import type {
  CreateEmergencyRequest,
  Emergency,
  EmergencyCategory,
  Uuid,
} from './apiTypes';

const encodeId = (id: Uuid): string => encodeURIComponent(id);

export const emergenciesApi = {
  getCategories(): Promise<EmergencyCategory[]> {
    return apiClient.get<EmergencyCategory[]>('/emergencies/categories');
  },

  listActive(): Promise<Emergency[]> {
    return apiClient.get<Emergency[]>('/emergencies', {
      auth: true,
    });
  },

  create(payload: CreateEmergencyRequest): Promise<Emergency> {
    return apiClient.post<Emergency>('/emergencies', payload, {
      auth: true,
    });
  },

  getMyHistory(): Promise<Emergency[]> {
    return apiClient.get<Emergency[]>('/emergencies/me/history', {
      auth: true,
    });
  },

  getById(emergencyId: Uuid): Promise<Emergency> {
    return apiClient.get<Emergency>(`/emergencies/${encodeId(emergencyId)}`, {
      auth: true,
    });
  },

  cancel(emergencyId: Uuid): Promise<Emergency> {
    return apiClient.patch<Emergency>(
      `/emergencies/${encodeId(emergencyId)}/cancel`,
      undefined,
      {
        auth: true,
      },
    );
  },

  resolve(emergencyId: Uuid): Promise<Emergency> {
    return apiClient.patch<Emergency>(
      `/emergencies/${encodeId(emergencyId)}/resolve`,
      undefined,
      {
        auth: true,
      },
    );
  },
};