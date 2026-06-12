import {Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
  type Permission,
  type PermissionStatus,
} from 'react-native-permissions';

export type LocationPermissionResult = {
  granted: boolean;
  status: PermissionStatus | 'unsupported';
  canAskAgain: boolean;
};

export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  timestamp: number;
};

const getPlatformLocationPermission = (): Permission | null => {
  if (Platform.OS === 'android') {
    return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  }

  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
  }

  return null;
};

const isGrantedStatus = (status: PermissionStatus): boolean => {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
};

const mapPermissionResult = (
  status: PermissionStatus | 'unsupported',
): LocationPermissionResult => {
  if (status === 'unsupported') {
    return {
      granted: false,
      status,
      canAskAgain: false,
    };
  }

  return {
    granted: isGrantedStatus(status),
    status,
    canAskAgain: status !== RESULTS.BLOCKED && status !== RESULTS.UNAVAILABLE,
  };
};

export const locationService = {
  async checkPermission(): Promise<LocationPermissionResult> {
    const permission = getPlatformLocationPermission();

    if (!permission) {
      return mapPermissionResult('unsupported');
    }

    const status = await check(permission);

    return mapPermissionResult(status);
  },

  async requestPermission(): Promise<LocationPermissionResult> {
    const permission = getPlatformLocationPermission();

    if (!permission) {
      return mapPermissionResult('unsupported');
    }

    const currentStatus = await check(permission);

    if (isGrantedStatus(currentStatus)) {
      return mapPermissionResult(currentStatus);
    }

    if (
      currentStatus === RESULTS.BLOCKED ||
      currentStatus === RESULTS.UNAVAILABLE
    ) {
      return mapPermissionResult(currentStatus);
    }

    const requestedStatus = await request(permission);

    return mapPermissionResult(requestedStatus);
  },

  async openAppSettings(): Promise<void> {
    await openSettings();
  },

  async getCurrentPosition(): Promise<CurrentLocation> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters:
              typeof position.coords.accuracy === 'number'
                ? position.coords.accuracy
                : null,
            timestamp: position.timestamp,
          });
        },
        error => {
          reject(
            new Error(
              error.message ||
                'Unable to get your current location. Please try again.',
            ),
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        },
      );
    });
  },

  async requestPermissionAndGetLocation(): Promise<CurrentLocation> {
    const permission = await this.requestPermission();

    if (!permission.granted) {
      throw new Error(
        permission.status === RESULTS.BLOCKED
          ? 'Location permission is blocked. Please enable it from app settings.'
          : 'Location permission is required to use emergency features.',
      );
    }

    return this.getCurrentPosition();
  },
};