import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors, spacing, type AppColorName} from '../theme';
import {Text} from './Text';

export type HeaderAction = {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export type HeaderProps = {
  title: string;
  subtitle?: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  backgroundColor?: AppColorName;
  borderBottom?: boolean;
  centerTitle?: boolean;
  style?: StyleProp<ViewStyle>;
};

const HeaderButton = ({action}: {action?: HeaderAction}) => {
  if (!action) {
    return <View style={styles.actionPlaceholder} />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      accessibilityState={{disabled: action.disabled}}
      disabled={action.disabled}
      hitSlop={8}
      onPress={action.onPress}
      style={({pressed}) => [
        styles.actionButton,
        pressed && !action.disabled && styles.pressed,
        action.disabled && styles.disabled,
      ]}>
      {action.icon}
    </Pressable>
  );
};

export const Header = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  backgroundColor = 'background',
  borderBottom = false,
  centerTitle = false,
  style,
}: HeaderProps) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors[backgroundColor],
          borderBottomColor: borderBottom ? colors.cardBorder : colors.transparent,
        },
        style,
      ]}>
      <HeaderButton action={leftAction} />

      <View style={[styles.titleContainer, centerTitle && styles.centerTitle]}>
        <Text
          variant="headingSmall"
          color="onSurface"
          align={centerTitle ? 'center' : 'left'}
          numberOfLines={1}>
          {title}
        </Text>

        {subtitle ? (
          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            align={centerTitle ? 'center' : 'left'}
            numberOfLines={1}
            style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <HeaderButton action={rightAction} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: spacing.headerHeight,
    paddingHorizontal: spacing.screenHorizontal,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centerTitle: {
    alignItems: 'center',
  },
  subtitle: {
    marginTop: spacing.xxs,
  },
  actionPlaceholder: {
    height: 40,
    width: 40,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  disabled: {
    opacity: 0.5,
  },
});