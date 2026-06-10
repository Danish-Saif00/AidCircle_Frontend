import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors, radius, shadows, spacing} from '../theme';

type CardVariant = 'default' | 'outlined' | 'elevated' | 'danger' | 'success';

export type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof spacing | 'none';
  style?: StyleProp<ViewStyle>;
};

export type PressableCardProps = CardProps &
  Omit<PressableProps, 'children' | 'style'> & {
    onPress: PressableProps['onPress'];
  };

const getVariantStyle = (variant: CardVariant): ViewStyle => {
  switch (variant) {
    case 'outlined':
      return {
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder,
        borderWidth: 1,
      };

    case 'elevated':
      return {
        backgroundColor: colors.cardBackground,
        borderColor: colors.transparent,
        borderWidth: 0,
        ...shadows.card,
      };

    case 'danger':
      return {
        backgroundColor: colors.dangerContainer,
        borderColor: colors.error,
        borderWidth: 1,
      };

    case 'success':
      return {
        backgroundColor: colors.successContainer,
        borderColor: colors.success,
        borderWidth: 1,
      };

    case 'default':
    default:
      return {
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder,
        borderWidth: 1,
      };
  }
};

const getPadding = (padding: CardProps['padding']) => {
  if (padding === 'none') {
    return 0;
  }

  return spacing[padding ?? 'cardPadding'];
};

export const Card = ({
  children,
  variant = 'default',
  padding = 'cardPadding',
  style,
}: CardProps) => {
  return (
    <View
      style={[
        styles.base,
        getVariantStyle(variant),
        {padding: getPadding(padding)},
        style,
      ]}>
      {children}
    </View>
  );
};

export const PressableCard = ({
  children,
  variant = 'default',
  padding = 'cardPadding',
  style,
  onPress,
  ...props
}: PressableCardProps) => {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        getVariantStyle(variant),
        {padding: getPadding(padding)},
        pressed && styles.pressed,
        style,
      ]}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
  },
  pressed: {
    opacity: 0.82,
  },
});