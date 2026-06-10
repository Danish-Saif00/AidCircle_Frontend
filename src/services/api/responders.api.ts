import {apiClient} from './apiClient';
import type {
  EmergencyResponder,
  UpdateResponderStatusRequest,
  Uuid,
} from './apiTypes';

const encodeId = (id: Uuid): string => encodeURIComponent(id);

export const respondersApi = {
  getStatus(): Promise<unknown> {
    return apiClient.get('/responders');
  },

  acceptEmergency(emergencyId: Uuid): Promise<EmergencyResponder> {
    return apiClient.post<EmergencyResponder>(
      `/responders/emergencies/${encodeId(emergencyId)}/accept`,
      undefined,
      {
        auth: true,
      },
    );
  },

  updateStatus(
    emergencyId: Uuid,
    payload: UpdateResponderStatusRequest,
  ): Promise<EmergencyResponder> {
    return apiClient.patch<EmergencyResponder>(
      `/responders/emergencies/${encodeId(emergencyId)}/status`,
      payload,
      {
        auth: true,
      },
    );
  },

  leaveEmergency(emergencyId: Uuid): Promise<EmergencyResponder> {
    return apiClient.delete<EmergencyResponder>(
      `/responders/emergencies/${encodeId(emergencyId)}/leave`,
      {
        auth: true,
      },
    );
  },

  getMyActiveResponses(): Promise<EmergencyResponder[]> {
    return apiClient.get<EmergencyResponder[]>('/responders/me/active', {
      auth: true,
    });
  },

  getMyResponseHistory(): Promise<EmergencyResponder[]> {
    return apiClient.get<EmergencyResponder[]>('/responders/me/history', {
      auth: true,
    });
  },
};