import {Platform} from 'react-native';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

import {PLATFORMS, STORAGE_KEYS, type DevicePlatform} from '../../config/constants';
import {notificationsApi, type UserDevice} from '../api';
import {appStorage} from '../storage/appStorage';

export type PushPermissionResult = {
  granted: boolean;
  status: number;
};

export type PushMessageHandler = (
  message: FirebaseMessagingTypes.RemoteMessage,
) => void | Promise<void>;

const isAuthorizedStatus = (status: number): boolean => {
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
};

const getDevicePlatform = (): DevicePlatform => {
  return Platform.OS === 'ios' ? PLATFORMS.IOS : PLATFORMS.ANDROID;
};

export const pushService = {
  async requestPermission(): Promise<PushPermissionResult> {
    const status = await messaging().requestPermission();

    return {
      granted: isAuthorizedStatus(status),
      status,
    };
  },

  async getFcmToken(): Promise<string> {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();

    if (!token) {
      throw new Error('Unable to generate push notification token.');
    }

    return token;
  },

  async registerCurrentDevice(): Promise<UserDevice> {
    const permission = await this.requestPermission();

    if (!permission.granted) {
      throw new Error('Notification permission is required for emergency alerts.');
    }

    const deviceToken = await this.getFcmToken();

    const device = await notificationsApi.registerDevice({
      platform: getDevicePlatform(),
      deviceToken,
    });

    await appStorage.setString(STORAGE_KEYS.DEVICE_ID, device.id);

    return device;
  },

  async deactivateStoredDevice(): Promise<void> {
    const deviceId = await appStorage.getString(STORAGE_KEYS.DEVICE_ID);

    if (!deviceId) {
      return;
    }

    try {
      await notificationsApi.deactivateDevice(deviceId);
    } finally {
      await appStorage.remove(STORAGE_KEYS.DEVICE_ID);
    }
  },

  onForegroundMessage(handler: PushMessageHandler): () => void {
    return messaging().onMessage(message => {
      void handler(message);
    });
  },

  onNotificationOpenedApp(handler: PushMessageHandler): () => void {
    return messaging().onNotificationOpenedApp(message => {
      void handler(message);
    });
  },

  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    return messaging().getInitialNotification();
  },

  onTokenRefresh(handler: (token: string) => void | Promise<void>): () => void {
    return messaging().onTokenRefresh(token => {
      void handler(token);
    });
  },

  setBackgroundMessageHandler(handler: PushMessageHandler): void {
    messaging().setBackgroundMessageHandler(async message => {
      await handler(message);
    });
  },
};