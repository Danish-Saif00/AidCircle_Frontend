import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
  StyleSheet,
} from 'react-native';

import {
  colors,
  type AppColorName,
  typography,
  type AppTypographyName,
} from '../theme';

type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

export type AppTextProps = RNTextProps & {
  children: React.ReactNode;
  variant?: AppTypographyName;
  color?: AppColorName;
  align?: TextAlign;
  weight?: TextStyle['fontWeight'];
  numberOfLines?: number;
};

export const Text = ({
  children,
  variant = 'bodyMedium',
  color = 'onSurface',
  align,
  weight,
  style,
  numberOfLines,
  ...props
}: AppTextProps) => {
  return (
    <RNText
      {...props}
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        typography[variant],
        {
          color: colors[color],
          textAlign: align,
          fontWeight: weight ?? typography[variant].fontWeight,
        },
        style,
      ]}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});