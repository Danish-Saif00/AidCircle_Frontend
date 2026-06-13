import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  check,
  request,
  RESULTS,
  type PermissionStatus,
} from 'react-native-permissions';

import {PLATFORMS, STORAGE_KEYS, type DevicePlatform} from '../../config/constants';
import {
  ANDROID_NOTIFICATION_PERMISSION,
  isAndroid,
} from '../../config/permissions';
import {notificationsApi, type UserDevice} from '../api';
import {appStorage} from '../storage/appStorage';

export type PushPermissionResult = {
  granted: boolean;
  status: number | PermissionStatus | 'unsupported';
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

const isGrantedPermissionStatus = (status: PermissionStatus): boolean => {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
};

const getDevicePlatform = (): DevicePlatform => {
  return isAndroid ? PLATFORMS.ANDROID : PLATFORMS.IOS;
};

const requestAndroidNotificationPermission =
  async (): Promise<PushPermissionResult | null> => {
    if (!isAndroid) {
      return null;
    }

    if (!ANDROID_NOTIFICATION_PERMISSION) {
      return {
        granted: false,
        status: 'unsupported',
      };
    }

    const currentStatus = await check(ANDROID_NOTIFICATION_PERMISSION);

    if (isGrantedPermissionStatus(currentStatus)) {
      return null;
    }

    if (
      currentStatus === RESULTS.BLOCKED ||
      currentStatus === RESULTS.UNAVAILABLE
    ) {
      return {
        granted: false,
        status: currentStatus,
      };
    }

    const requestedStatus = await request(ANDROID_NOTIFICATION_PERMISSION);

    if (!isGrantedPermissionStatus(requestedStatus)) {
      return {
        granted: false,
        status: requestedStatus,
      };
    }

    return null;
  };

export const pushService = {
  async requestPermission(): Promise<PushPermissionResult> {
    const androidPermissionResult = await requestAndroidNotificationPermission();

    if (androidPermissionResult) {
      return androidPermissionResult;
    }

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