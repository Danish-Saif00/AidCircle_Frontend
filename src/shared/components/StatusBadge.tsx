import React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';

import {colors, radius, spacing} from '../theme';
import {Text} from './Text';

type StatusBadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

type StatusBadgeSize = 'sm' | 'md';

export type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  size?: StatusBadgeSize;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

const getToneStyles = (tone: StatusBadgeTone) => {
  switch (tone) {
    case 'primary':
      return {
        backgroundColor: colors.primaryFixed,
        textColor: 'onPrimaryFixed' as const,
        dotColor: colors.primary,
      };

    case 'success':
      return {
        backgroundColor: colors.successContainer,
        textColor: 'onTertiaryFixed' as const,
        dotColor: colors.success,
      };

    case 'warning':
      return {
        backgroundColor: colors.warningContainer,
        textColor: 'onWarningContainer' as const,
        dotColor: colors.warning,
      };

    case 'danger':
      return {
        backgroundColor: colors.dangerContainer,
        textColor: 'onErrorContainer' as const,
        dotColor: colors.danger,
      };

    case 'info':
      return {
        backgroundColor: colors.infoContainer,
        textColor: 'onSecondaryFixed' as const,
        dotColor: colors.info,
      };

    case 'neutral':
    default:
      return {
        backgroundColor: colors.surfaceContainerHigh,
        textColor: 'onSurfaceVariant' as const,
        dotColor: colors.onSurfaceVariant,
      };
  }
};

const getSizeStyles = (size: StatusBadgeSize) => {
  switch (size) {
    case 'sm':
      return {
        container: styles.small,
        textVariant: 'labelSmall' as const,
        dot: styles.smallDot,
      };

    case 'md':
    default:
      return {
        container: styles.medium,
        textVariant: 'labelMedium' as const,
        dot: styles.mediumDot,
      };
  }
};

export const StatusBadge = ({
  label,
  tone = 'neutral',
  size = 'md',
  dot = false,
  style,
}: StatusBadgeProps) => {
  const toneStyles = getToneStyles(tone);
  const sizeStyles = getSizeStyles(size);

  return (
    <View
      style={[
        styles.base,
        sizeStyles.container,
        {backgroundColor: toneStyles.backgroundColor},
        style,
      ]}>
      {dot ? (
        <View
          style={[
            styles.dot,
            sizeStyles.dot,
            {backgroundColor: toneStyles.dotColor},
          ]}
        />
      ) : null}

      <Text
        variant={sizeStyles.textVariant}
        color={toneStyles.textColor}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  small: {
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  medium: {
    minHeight: 30,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dot: {
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  smallDot: {
    height: 6,
    width: 6,
  },
  mediumDot: {
    height: 8,
    width: 8,
  },
});