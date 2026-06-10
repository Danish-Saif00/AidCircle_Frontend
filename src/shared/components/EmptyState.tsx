import React from 'react';
import {Inbox} from 'lucide-react-native';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';

import {colors, spacing} from '../theme';
import {Button} from './Button';
import {Text} from './Text';

export type EmptyStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const EmptyState = ({
  title = 'Nothing here yet',
  message = 'There is no data to show right now.',
  actionLabel,
  onActionPress,
  icon,
  fullScreen = false,
  style,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <View style={styles.iconWrap}>
        {icon ?? (
          <Inbox color={colors.onSurfaceVariant} size={34} strokeWidth={2.2} />
        )}
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

      {actionLabel && onActionPress ? (
        <Button
          title={actionLabel}
          variant="primary"
          onPress={onActionPress}
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
    backgroundColor: colors.surfaceContainerHigh,
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