import React, {forwardRef, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  View,
} from 'react-native';

import {
  colors,
  radius,
  spacing,
  typography,
  type AppColorName,
} from '../theme';
import {Text} from './Text';

export type AppTextInputProps = Omit<RNTextInputProps, 'style'> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  backgroundColor?: AppColorName;
};

export const TextInput = forwardRef<RNTextInput, AppTextInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      backgroundColor = 'inputBackground',
      editable = true,
      placeholderTextColor = colors.inputPlaceholder,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    const hasError = Boolean(error);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <Text variant="labelMedium" color="onSurface" style={styles.label}>
            {label}
          </Text>
        ) : null}

        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors[backgroundColor],
              borderColor: hasError
                ? colors.error
                : focused
                  ? colors.inputFocusedBorder
                  : colors.inputBorder,
              opacity: editable ? 1 : 0.6,
            },
          ]}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}

          <RNTextInput
            ref={ref}
            {...props}
            editable={editable}
            placeholderTextColor={placeholderTextColor}
            onFocus={event => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={event => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[styles.input, inputStyle]}
          />

          {rightIcon ? (
            onRightIconPress ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={onRightIconPress}
                style={styles.icon}>
                {rightIcon}
              </Pressable>
            ) : (
              <View style={styles.icon}>{rightIcon}</View>
            )
          ) : null}
        </View>

        {hasError ? (
          <Text variant="bodySmall" color="error" style={styles.helperText}>
            {error}
          </Text>
        ) : hint ? (
          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.helperText}>
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    alignItems: 'center',
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: spacing.inputHorizontal,
  },
  input: {
    ...typography.bodyMedium,
    color: colors.onSurface,
    flex: 1,
    minHeight: 48,
    paddingVertical: spacing.inputVertical,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  helperText: {
    marginTop: spacing.xs,
  },
});