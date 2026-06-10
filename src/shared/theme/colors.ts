export const colors = {
  background: '#f9f9f9',
  onBackground: '#1a1c1c',

  surface: '#f9f9f9',
  surfaceDim: '#dadada',
  surfaceBright: '#f9f9f9',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f3f3f3',
  surfaceContainer: '#eeeeee',
  surfaceContainerHigh: '#e8e8e8',
  surfaceContainerHighest: '#e2e2e2',
  surfaceVariant: '#e2e2e2',

  onSurface: '#1a1c1c',
  onSurfaceVariant: '#5b403d',
  inverseSurface: '#2f3131',
  inverseOnSurface: '#f1f1f1',

  outline: '#906f6c',
  outlineVariant: '#e4beb9',

  primary: '#b7131a',
  onPrimary: '#ffffff',
  primaryContainer: '#db322f',
  onPrimaryContainer: '#fffbff',
  inversePrimary: '#ffb4ac',
  surfaceTint: '#bb171c',

  secondary: '#4c56af',
  onSecondary: '#ffffff',
  secondaryContainer: '#959efd',
  onSecondaryContainer: '#27308a',

  tertiary: '#006b1b',
  onTertiary: '#ffffff',
  tertiaryContainer: '#268630',
  onTertiaryContainer: '#f7fff1',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  primaryFixed: '#ffdad6',
  primaryFixedDim: '#ffb4ac',
  onPrimaryFixed: '#410002',
  onPrimaryFixedVariant: '#93000d',

  secondaryFixed: '#e0e0ff',
  secondaryFixedDim: '#bdc2ff',
  onSecondaryFixed: '#000767',
  onSecondaryFixedVariant: '#343d96',

  tertiaryFixed: '#98f994',
  tertiaryFixedDim: '#7ddc7a',
  onTertiaryFixed: '#002204',
  onTertiaryFixedVariant: '#005313',

  white: '#ffffff',
  black: '#000000',

  transparent: 'transparent',

  success: '#006b1b',
  successContainer: '#98f994',
  onSuccess: '#ffffff',

  warning: '#8a5200',
  warningContainer: '#ffddb0',
  onWarning: '#ffffff',
  onWarningContainer: '#2c1600',

  danger: '#b7131a',
  dangerContainer: '#ffdad6',
  onDanger: '#ffffff',

  info: '#4c56af',
  infoContainer: '#e0e0ff',
  onInfo: '#ffffff',

  disabled: '#dadada',
  onDisabled: '#8b8b8b',

  shadow: '#000000',

  tabBar: '#ffffff',
  tabBarBorder: '#e2e2e2',
  tabBarActive: '#b7131a',
  tabBarInactive: '#5b403d',

  inputBackground: '#ffffff',
  inputBorder: '#dadada',
  inputFocusedBorder: '#4c56af',
  inputPlaceholder: '#906f6c',

  cardBackground: '#ffffff',
  cardBorder: '#e2e2e2',

  mapHelperMarker: '#006b1b',
  mapEmergencyMarker: '#b7131a',
  mapCurrentUserMarker: '#4c56af',
} as const;

export type AppColorName = keyof typeof colors;