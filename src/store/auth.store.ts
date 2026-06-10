import {create} from 'zustand';

import {STORAGE_KEYS} from '../config/constants';
import type {
  AuthResponseData,
  AuthSession,
  AuthUser,
  UserProfile,
} from '../services/api';
import {appStorage} from '../services/storage/appStorage';
import {tokenStorage} from '../services/storage/tokenStorage';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  isHydrated: boolean;

  setLoading: () => void;
  setUnauthenticated: () => Promise<void>;
  setSession: (data: AuthResponseData) => Promise<void>;
  setAuthSnapshot: (data: {
    user: AuthUser;
    profile: UserProfile;
  }) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  clearSession: () => Promise<void>;
};

const saveAuthSnapshot = async (
  user: AuthUser,
  profile: UserProfile,
): Promise<void> => {
  await Promise.all([
    appStorage.setJson(STORAGE_KEYS.AUTH_USER, user),
    appStorage.setJson(STORAGE_KEYS.USER_PROFILE, profile),
  ]);
};

const clearAuthStorage = async (): Promise<void> => {
  await Promise.all([tokenStorage.clearTokens(), appStorage.clearAppState()]);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  profile: null,
  isHydrated: false,

  setLoading: () => {
    set({status: 'loading'});
  },

  setUnauthenticated: async () => {
    await clearAuthStorage();

    set({
      status: 'unauthenticated',
      user: null,
      profile: null,
      isHydrated: true,
    });
  },

  setSession: async (data: AuthResponseData) => {
    await Promise.all([
      tokenStorage.saveSession(data.session),
      saveAuthSnapshot(data.user, data.profile),
    ]);

    set({
      status: 'authenticated',
      user: data.user,
      profile: data.profile,
      isHydrated: true,
    });
  },

  setAuthSnapshot: async ({user, profile}) => {
    await saveAuthSnapshot(user, profile);

    set({
      status: 'authenticated',
      user,
      profile,
      isHydrated: true,
    });
  },

  updateProfile: async (profile: UserProfile) => {
    const currentUser = get().user;

    await appStorage.setJson(STORAGE_KEYS.USER_PROFILE, profile);

    set({
      profile,
      user: currentUser
        ? {
            ...currentUser,
            role: profile.role,
            email: profile.email,
            phone: profile.phone,
          }
        : currentUser,
    });
  },

  hydrateFromStorage: async () => {
    const [hasTokens, cachedUser, cachedProfile] = await Promise.all([
      tokenStorage.hasTokens(),
      appStorage.getJson<AuthUser>(STORAGE_KEYS.AUTH_USER),
      appStorage.getJson<UserProfile>(STORAGE_KEYS.USER_PROFILE),
    ]);

    if (!hasTokens || !cachedUser || !cachedProfile) {
      await clearAuthStorage();

      set({
        status: 'unauthenticated',
        user: null,
        profile: null,
        isHydrated: true,
      });

      return;
    }

    set({
      status: 'authenticated',
      user: cachedUser,
      profile: cachedProfile,
      isHydrated: true,
    });
  },

  clearSession: async () => {
    await clearAuthStorage();

    set({
      status: 'unauthenticated',
      user: null,
      profile: null,
      isHydrated: true,
    });
  },
}));

export const authStore = {
  getState: useAuthStore.getState,
  setState: useAuthStore.setState,
};