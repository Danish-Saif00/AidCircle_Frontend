export const spacing = {
  none: 0,

  xxxs: 2,
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,

  screenHorizontal: 20,
  screenVertical: 16,

  cardPadding: 16,
  cardGap: 12,

  buttonHorizontal: 18,
  buttonVertical: 14,

  inputHorizontal: 14,
  inputVertical: 12,

  tabBarHeight: 72,
  headerHeight: 56,

  sosButtonSize: 156,
  mapMarkerSize: 42,
} as const;

export type AppSpacingName = keyof typeof spacing;