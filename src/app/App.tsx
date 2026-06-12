import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';

import {RootNavigator} from '../navigation/RootNavigator';
import {colors} from '../shared/theme';
import {useAppStore, useAuthStore} from '../store';
import {AppProviders} from './providers/AppProviders';

export const App = () => {
  const hydrateFromStorage = useAuthStore(state => state.hydrateFromStorage);
  const hydrateAppState = useAppStore(state => state.hydrateAppState);

  useEffect(() => {
    void Promise.all([hydrateFromStorage(), hydrateAppState()]);
  }, [hydrateFromStorage, hydrateAppState]);

  return (
    <AppProviders>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </AppProviders>
  );
};