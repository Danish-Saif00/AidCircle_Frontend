import AsyncStorage from '@react-native-async-storage/async-storage';

import {STORAGE_KEYS} from '../../config/constants';

type AppStorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const appStorage = {
  async setString(key: AppStorageKey, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async getString(key: AppStorageKey): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async setBoolean(key: AppStorageKey, value: boolean): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async getBoolean(key: AppStorageKey): Promise<boolean> {
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return false;
    }

    try {
      return JSON.parse(value) === true;
    } catch {
      return false;
    }
  },

  async setJson<TValue>(key: AppStorageKey, value: TValue): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async getJson<TValue>(key: AppStorageKey): Promise<TValue | null> {
    const value = await AsyncStorage.getItem(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as TValue;
    } catch {
      await AsyncStorage.removeItem(key);
      return null;
    }
  },

  async remove(key: AppStorageKey): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clearAppState(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE),
      AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.HAS_COMPLETED_PERMISSIONS_SETUP),
    ]);
  },
};