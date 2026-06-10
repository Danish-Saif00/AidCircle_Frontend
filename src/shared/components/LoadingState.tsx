import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors, spacing, type AppColorName} from '../theme';
import {Text} from './Text';

export type LoadingStateProps = {
  title?: string;
  message?: string;
  color?: AppColorName;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const LoadingState = ({
  title = 'Loading',
  message,
  color = 'primary',
  fullScreen = false,
  style,
}: LoadingStateProps) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator color={colors[color]} size="large" />

      {title ? (
        <Text
          variant="headingSmall"
          color="onSurface"
          align="center"
          style={styles.title}>
          {title}
        </Text>
      ) : null}

      {message ? (
        <Text
          variant="bodyMedium"
          color="onSurfaceVariant"
          align="center"
          style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  fullScreen: {
    flex: 1,
  },
  title: {
    marginTop: spacing.lg,
  },
  message: {
    marginTop: spacing.sm,
  },
});