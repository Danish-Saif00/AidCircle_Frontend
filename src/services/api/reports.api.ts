import {apiClient} from './apiClient';
import type {
  CreateReportRequest,
  Report,
  UpdateReportStatusRequest,
  Uuid,
} from './apiTypes';

const encodeId = (id: Uuid): string => encodeURIComponent(id);

export const reportsApi = {
  getStatus(): Promise<unknown> {
    return apiClient.get('/reports');
  },

  reportEmergency(
    emergencyId: Uuid,
    payload: CreateReportRequest,
  ): Promise<Report> {
    return apiClient.post<Report>(
      `/reports/emergencies/${encodeId(emergencyId)}`,
      payload,
      {
        auth: true,
      },
    );
  },

  reportUser(userId: Uuid, payload: CreateReportRequest): Promise<Report> {
    return apiClient.post<Report>(
      `/reports/users/${encodeId(userId)}`,
      payload,
      {
        auth: true,
      },
    );
  },

  getMyReports(): Promise<Report[]> {
    return apiClient.get<Report[]>('/reports/me', {
      auth: true,
    });
  },

  adminListReports(): Promise<Report[]> {
    return apiClient.get<Report[]>('/reports/admin', {
      auth: true,
    });
  },

  adminUpdateReportStatus(
    reportId: Uuid,
    payload: UpdateReportStatusRequest,
  ): Promise<Report> {
    return apiClient.patch<Report>(
      `/reports/admin/${encodeId(reportId)}/status`,
      payload,
      {
        auth: true,
      },
    );
  },
};