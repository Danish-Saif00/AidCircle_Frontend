import {create} from 'zustand';

import {STORAGE_KEYS} from '../config/constants';
import {appStorage} from '../services/storage/appStorage';

export type LocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  updatedAt: string;
};

type AppState = {
  hasCompletedPermissionsSetup: boolean;
  currentLocation: LocationSnapshot | null;
  isAppHydrated: boolean;

  hydrateAppState: () => Promise<void>;
  setPermissionsSetupCompleted: (completed: boolean) => Promise<void>;
  setCurrentLocation: (location: LocationSnapshot | null) => void;
  resetAppState: () => Promise<void>;
};

export const useAppStore = create<AppState>(set => ({
  hasCompletedPermissionsSetup: false,
  currentLocation: null,
  isAppHydrated: false,

  hydrateAppState: async () => {
    const hasCompletedPermissionsSetup = await appStorage.getBoolean(
      STORAGE_KEYS.HAS_COMPLETED_PERMISSIONS_SETUP,
    );

    set({
      hasCompletedPermissionsSetup,
      isAppHydrated: true,
    });
  },

  setPermissionsSetupCompleted: async (completed: boolean) => {
    await appStorage.setBoolean(
      STORAGE_KEYS.HAS_COMPLETED_PERMISSIONS_SETUP,
      completed,
    );

    set({
      hasCompletedPermissionsSetup: completed,
    });
  },

  setCurrentLocation: (location: LocationSnapshot | null) => {
    set({
      currentLocation: location,
    });
  },

  resetAppState: async () => {
    await appStorage.clearAppState();

    set({
      hasCompletedPermissionsSetup: false,
      currentLocation: null,
      isAppHydrated: true,
    });
  },
}));

export const appStore = {
  getState: useAppStore.getState,
  setState: useAppStore.setState,
};