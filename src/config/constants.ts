export const APP_CONFIG = {
  NAME: 'AidCircle',
  DEFAULT_ALERT_RADIUS_KM: 5,
  SOS_AUTO_EXPIRE_MINUTES: 120,
  LIVE_STATUS_POLL_INTERVAL_MS: 15000,
  NEARBY_REFRESH_INTERVAL_MS: 30000,
  REQUEST_TIMEOUT_MS_FALLBACK: 30000,
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'aidcircle.accessToken',
  REFRESH_TOKEN: 'aidcircle.refreshToken',
  AUTH_USER: 'aidcircle.authUser',
  USER_PROFILE: 'aidcircle.userProfile',
  DEVICE_ID: 'aidcircle.deviceId',
  HAS_COMPLETED_PERMISSIONS_SETUP: 'aidcircle.hasCompletedPermissionsSetup',
} as const;

export const USER_ROLES = {
  USER: 'user',
  HELPER: 'helper',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const EMERGENCY_STATUSES = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type EmergencyStatus =
  (typeof EMERGENCY_STATUSES)[keyof typeof EMERGENCY_STATUSES];

export const EMERGENCY_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type EmergencyPriority =
  (typeof EMERGENCY_PRIORITIES)[keyof typeof EMERGENCY_PRIORITIES];

export const RESPONDER_STATUSES = {
  ACCEPTED: 'accepted',
  ON_WAY: 'on_way',
  ARRIVED: 'arrived',
  CANCELLED: 'cancelled',
} as const;

export type ResponderStatus =
  (typeof RESPONDER_STATUSES)[keyof typeof RESPONDER_STATUSES];

export const NOTIFICATION_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  READ: 'read',
} as const;

export type NotificationStatus =
  (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];

export const REPORT_STATUSES = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
  ACTION_TAKEN: 'action_taken',
} as const;

export type ReportStatus =
  (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

export const PLATFORMS = {
  ANDROID: 'android',
  IOS: 'ios',
} as const;

export type DevicePlatform = (typeof PLATFORMS)[keyof typeof PLATFORMS];

export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const VALIDATION_LIMITS = {
  FULL_NAME_MIN: 2,
  FULL_NAME_MAX: 80,
  PASSWORD_MIN: 8,
  PHONE_MAX: 30,
  SOS_TITLE_MIN: 3,
  SOS_TITLE_MAX: 120,
  SOS_DESCRIPTION_MAX: 1000,
  REPORT_REASON_MIN: 3,
  REPORT_REASON_MAX: 120,
  REPORT_DESCRIPTION_MAX: 1000,
  MEDICAL_NOTES_MAX: 1000,
} as const;

export const LOCATION_LIMITS = {
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180,
  MIN_RADIUS_KM: 1,
  MAX_RADIUS_KM: 50,
} as const;