export const radius = {
  none: 0,

  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,

  button: 14,
  input: 12,
  card: 18,
  sheet: 28,
  modal: 24,

  sosButton: 999,
  mapMarker: 999,
} as const;

export type AppRadiusName = keyof typeof radius;