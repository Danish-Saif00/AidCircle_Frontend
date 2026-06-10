import {apiClient} from './apiClient';
import type {
  RegisterDeviceRequest,
  TestPushRequest,
  UserDevice,
  UserNotification,
  Uuid,
} from './apiTypes';

const encodeId = (id: Uuid): string => encodeURIComponent(id);

export type TestPushResponseData = {
  notification: UserNotification;
  push?: {
    attempted: boolean;
    successCount?: number;
    failureCount?: number;
  };
};

export const notificationsApi = {
  getStatus(): Promise<unknown> {
    return apiClient.get('/notifications');
  },

  registerDevice(payload: RegisterDeviceRequest): Promise<UserDevice> {
    return apiClient.post<UserDevice>('/notifications/devices', payload, {
      auth: true,
    });
  },

  deactivateDevice(deviceId: Uuid): Promise<UserDevice> {
    return apiClient.delete<UserDevice>(
      `/notifications/devices/${encodeId(deviceId)}`,
      {
        auth: true,
      },
    );
  },

  getMyNotifications(): Promise<UserNotification[]> {
    return apiClient.get<UserNotification[]>('/notifications/me', {
      auth: true,
    });
  },

  markAsRead(notificationId: Uuid): Promise<UserNotification> {
    return apiClient.patch<UserNotification>(
      `/notifications/${encodeId(notificationId)}/read`,
      undefined,
      {
        auth: true,
      },
    );
  },

  sendTestPush(payload?: TestPushRequest): Promise<TestPushResponseData> {
    return apiClient.post<TestPushResponseData>(
      '/notifications/test-push',
      payload ?? {},
      {
        auth: true,
      },
    );
  },
};