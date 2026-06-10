import React from 'react';
import {AlertCircle} from 'lucide-react-native';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';

import {colors, spacing} from '../theme';
import {Button} from './Button';
import {Text} from './Text';

export type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Please try again.',
  retryLabel = 'Try Again',
  onRetry,
  fullScreen = false,
  style,
}: ErrorStateProps) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <View style={styles.iconWrap}>
        <AlertCircle color={colors.error} size={34} strokeWidth={2.4} />
      </View>

      <Text
        variant="headingSmall"
        color="onSurface"
        align="center"
        style={styles.title}>
        {title}
      </Text>

      {message ? (
        <Text
          variant="bodyMedium"
          color="onSurfaceVariant"
          align="center"
          style={styles.message}>
          {message}
        </Text>
      ) : null}

      {onRetry ? (
        <Button
          title={retryLabel}
          variant="primary"
          onPress={onRetry}
          style={styles.button}
        />
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
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  title: {
    marginTop: spacing.lg,
  },
  message: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
  },
});