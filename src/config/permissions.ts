import {Platform} from 'react-native';
import {PERMISSIONS, type Permission} from 'react-native-permissions';

const ANDROID_POST_NOTIFICATIONS =
  'android.permission.POST_NOTIFICATIONS' as Permission;

export const APP_PERMISSIONS = {
  LOCATION_FINE:
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,

  LOCATION_COARSE:
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,

  NOTIFICATIONS:
    Platform.OS === 'android' ? ANDROID_POST_NOTIFICATIONS : null,
} as const;

export const LOCATION_PERMISSIONS: Permission[] = [
  APP_PERMISSIONS.LOCATION_FINE,
  APP_PERMISSIONS.LOCATION_COARSE,
];

export const ANDROID_NOTIFICATION_PERMISSION =
  APP_PERMISSIONS.NOTIFICATIONS ?? undefined;

export const isAndroid = Platform.OS === 'android';

export const isIos = Platform.OS === 'ios';