import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors, radius, spacing} from '../theme';
import {Text} from './Text';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'outline'
  | 'ghost';

type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const getVariantStyles = (variant: ButtonVariant, disabled?: boolean) => {
  if (disabled) {
    return {
      container: {
        backgroundColor: colors.disabled,
        borderColor: colors.disabled,
      },
      textColor: 'onDisabled' as const,
      loaderColor: colors.onDisabled,
    };
  }

  switch (variant) {
    case 'secondary':
      return {
        container: {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
        },
        textColor: 'onSecondary' as const,
        loaderColor: colors.onSecondary,
      };

    case 'success':
      return {
        container: {
          backgroundColor: colors.success,
          borderColor: colors.success,
        },
        textColor: 'onSuccess' as const,
        loaderColor: colors.onSuccess,
      };

    case 'danger':
      return {
        container: {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
        },
        textColor: 'onDanger' as const,
        loaderColor: colors.onDanger,
      };

    case 'outline':
      return {
        container: {
          backgroundColor: colors.transparent,
          borderColor: colors.primary,
        },
        textColor: 'primary' as const,
        loaderColor: colors.primary,
      };

    case 'ghost':
      return {
        container: {
          backgroundColor: colors.transparent,
          borderColor: colors.transparent,
        },
        textColor: 'primary' as const,
        loaderColor: colors.primary,
      };

    case 'primary':
    default:
      return {
        container: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        textColor: 'onPrimary' as const,
        loaderColor: colors.onPrimary,
      };
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return {
        container: styles.sizeSmall,
        textVariant: 'labelMedium' as const,
        loaderSize: 'small' as const,
      };

    case 'lg':
      return {
        container: styles.sizeLarge,
        textVariant: 'button' as const,
        loaderSize: 'small' as const,
      };

    case 'md':
    default:
      return {
        container: styles.sizeMedium,
        textVariant: 'button' as const,
        loaderSize: 'small' as const,
      };
  }
};

export const Button = ({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  onPress,
  ...props
}: ButtonProps) => {
  const variantStyles = getVariantStyles(variant, disabled || loading);
  const sizeStyles = getSizeStyles(size);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variantStyles.loaderColor}
          size={sizeStyles.loaderSize}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}

          <Text
            variant={sizeStyles.textVariant}
            color={variantStyles.textColor}
            numberOfLines={1}>
            {title}
          </Text>

          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.78,
  },
  sizeSmall: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sizeMedium: {
    minHeight: 48,
    paddingHorizontal: spacing.buttonHorizontal,
    paddingVertical: spacing.buttonVertical,
  },
  sizeLarge: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});