export const fontFamily = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  displaySm: 28,
  displayMd: 32,
  displayLg: 40,
} as const;

export const lineHeight = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 22,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  displaySm: 36,
  displayMd: 40,
  displayLg: 48,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const typography = {
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.displayLg,
    lineHeight: lineHeight.displayLg,
    fontWeight: fontWeight.bold,
  },

  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.displayMd,
    lineHeight: lineHeight.displayMd,
    fontWeight: fontWeight.bold,
  },

  displaySmall: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.displaySm,
    lineHeight: lineHeight.displaySm,
    fontWeight: fontWeight.bold,
  },

  headingLarge: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    lineHeight: lineHeight.xxxl,
    fontWeight: fontWeight.bold,
  },

  headingMedium: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontWeight: fontWeight.semibold,
  },

  headingSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.semibold,
  },

  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.regular,
  },

  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.regular,
  },

  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
  },

  labelLarge: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.medium,
  },

  labelMedium: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
  },

  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.medium,
  },

  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.semibold,
  },

  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
  },
} as const;

export type AppTypographyName = keyof typeof typography;