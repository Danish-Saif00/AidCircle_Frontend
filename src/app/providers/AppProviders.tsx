import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {colors} from '../../shared/theme';
import {QueryProvider} from './QueryProvider';

export type AppProvidersProps = {
  children: React.ReactNode;
};

export const AppProviders = ({children}: AppProvidersProps) => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryProvider>{children}</QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});