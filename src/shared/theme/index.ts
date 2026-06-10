import {colors} from './colors';
import {radius} from './radius';
import {shadows} from './shadows';
import {spacing} from './spacing';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  typography,
} from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} as const;

export type AppTheme = typeof theme;

export {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
};

export type {AppColorName} from './colors';
export type {AppRadiusName} from './radius';
export type {AppShadowName} from './shadows';
export type {AppSpacingName} from './spacing';
export type {AppTypographyName} from './typography';