import React, {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';

import type {RootScreenProps} from '../../navigation/navigation.types';
import {authApi} from '../../services/api';
import {Screen, Text, LoadingState} from '../../shared/components';
import {colors, radius, shadows, spacing} from '../../shared/theme';
import {useAppStore, useAuthStore} from '../../store';

type SplashScreenProps = RootScreenProps<'Splash'>;

export const SplashScreen = ({navigation}: SplashScreenProps) => {
  const hasNavigatedRef = useRef(false);

  const hydrateFromStorage = useAuthStore(state => state.hydrateFromStorage);
  const setAuthSnapshot = useAuthStore(state => state.setAuthSnapshot);
  const setUnauthenticated = useAuthStore(state => state.setUnauthenticated);

  const hydrateAppState = useAppStore(state => state.hydrateAppState);
  const hasCompletedPermissionsSetup = useAppStore(
    state => state.hasCompletedPermissionsSetup,
  );

  useEffect(() => {
    const restoreSession = async () => {
      if (hasNavigatedRef.current) {
        return;
      }

      try {
        await Promise.all([hydrateFromStorage(), hydrateAppState()]);

        const currentAuthState = useAuthStore.getState();

        if (currentAuthState.status !== 'authenticated') {
          hasNavigatedRef.current = true;

          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Auth',
                params: {
                  screen: 'Welcome',
                },
              },
            ],
          });

          return;
        }

        try {
          const authMe = await authApi.me();

          await setAuthSnapshot({
            user: authMe.user,
            profile: authMe.profile,
          });

          hasNavigatedRef.current = true;

          const currentAppState = useAppStore.getState();

          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'App',
                params: currentAppState.hasCompletedPermissionsSetup
                  ? {
                      screen: 'MainTabs',
                      params: {
                        screen: 'HomeTab',
                        params: {
                          screen: 'HomeMapSos',
                        },
                      },
                    }
                  : {
                      screen: 'PermissionsSetup',
                    },
              },
            ],
          });
        } catch {
          await setUnauthenticated();

          hasNavigatedRef.current = true;

          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Auth',
                params: {
                  screen: 'Login',
                },
              },
            ],
          });
        }
      } catch {
        await setUnauthenticated();

        hasNavigatedRef.current = true;

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Auth',
              params: {
                screen: 'Login',
              },
            },
          ],
        });
      }
    };

    restoreSession();
  }, [
    hasCompletedPermissionsSetup,
    hydrateAppState,
    hydrateFromStorage,
    navigation,
    setAuthSnapshot,
    setUnauthenticated,
  ]);

  return (
    <Screen safeArea={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text variant="displayMedium" color="onPrimary" weight="800">
            SOS
          </Text>
        </View>

        <Text variant="displaySmall" color="onSurface" style={styles.appName}>
          AidCircle
        </Text>

        <Text
          variant="bodyMedium"
          color="onSurfaceVariant"
          align="center"
          style={styles.tagline}>
          Nearby emergency help when every second matters.
        </Text>
      </View>

      <LoadingState
        title="Preparing your app"
        message="Restoring your secure session..."
        style={styles.loading}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 132,
    justifyContent: 'center',
    width: 132,
    ...shadows.sosButton,
  },
  appName: {
    marginTop: spacing.xxl,
  },
  tagline: {
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  loading: {
    marginTop: spacing.massive,
  },
});