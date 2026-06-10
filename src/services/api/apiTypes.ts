import type {
  DevicePlatform,
  EmergencyPriority,
  EmergencyStatus,
  ReportStatus,
  ResponderStatus,
  UserRole,
} from '../../config/constants';

export type Uuid = string;
export type IsoDateString = string;

export type ApiSuccessResponse<TData = undefined> = {
  success: true;
  message: string;
  data?: TData;
};

export type ApiErrorDetail = {
  field?: string;
  message: string;
  code?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  requestId?: string;
  error?: {
    code?: string;
    details?: ApiErrorDetail[];
  };
};

export type ApiResponse<TData = undefined> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse;

export type NormalizedApiError = {
  status: number;
  message: string;
  code?: string;
  requestId?: string;
  details: ApiErrorDetail[];
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number | null;
};

export type AuthUser = {
  id: Uuid;
  email: string | null;
  phone: string | null;
  role: UserRole | string | null;
};

export type UserProfile = {
  id: Uuid;
  fullName: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  isHelperAvailable: boolean;
  isBlocked: boolean;
  bloodGroup: string | null;
  medicalNotes: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type PublicUserProfile = {
  id: Uuid;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  isHelperAvailable: boolean;
  isBlocked: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type AuthResponseData = {
  user: AuthUser;
  profile: UserProfile;
  session: AuthSession;
};

export type SignupRequest = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type UpdateProfileRequest = {
  fullName?: string;
  avatarUrl?: string;
  isHelperAvailable?: boolean;
  bloodGroup?: string | null;
  medicalNotes?: string | null;
};

export type AdminUpdateUserRequest = {
  role?: UserRole;
  isVerified?: boolean;
  isBlocked?: boolean;
  isHelperAvailable?: boolean;
};

export type UserLocation = {
  userId: Uuid;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  lastUpdatedAt: IsoDateString;
};

export type UpdateLocationRequest = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type NearbyUsersQuery = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
};

export type NearbyEmergenciesQuery = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
};

export type NearbyUser = PublicUserProfile & {
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
};

export type EmergencyCategory = {
  id: Uuid;
  name: string;
  slug: string;
  description: string | null;
  priority: EmergencyPriority;
  isActive: boolean;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
};

export type Emergency = {
  id: Uuid;
  requesterId: Uuid;
  categoryId: Uuid;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radiusKm: number;
  status: EmergencyStatus;
  priority: EmergencyPriority;
  resolvedAt: IsoDateString | null;
  cancelledAt: IsoDateString | null;
  expiresAt: IsoDateString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CreateEmergencyRequest = {
  categoryId: Uuid;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  priority?: EmergencyPriority;
};

export type EmergencyResponder = {
  id: Uuid;
  emergencyId: Uuid;
  responderId: Uuid;
  status: ResponderStatus;
  acceptedAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type UpdateResponderStatusRequest = {
  status: Extract<ResponderStatus, 'on_way' | 'arrived' | 'cancelled'>;
};

export type UserDevice = {
  id: Uuid;
  userId: Uuid;
  platform: DevicePlatform;
  deviceToken?: string;
  isActive: boolean;
  lastSeenAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type RegisterDeviceRequest = {
  platform: DevicePlatform;
  deviceToken: string;
};

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export type UserNotification = {
  id: Uuid;
  userId: Uuid;
  emergencyId: Uuid | null;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  sentAt: IsoDateString | null;
  readAt: IsoDateString | null;
  errorMessage: string | null;
  createdAt: IsoDateString;
};

export type TestPushRequest = {
  title?: string;
  body?: string;
  payload?: Record<string, unknown>;
};

export type Report = {
  id: Uuid;
  reporterId: Uuid;
  emergencyId: Uuid | null;
  reportedUserId: Uuid | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reviewedBy: Uuid | null;
  reviewedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CreateReportRequest = {
  reason: string;
  description?: string;
};

export type UpdateReportStatusRequest = {
  status: Extract<ReportStatus, 'reviewed' | 'dismissed' | 'action_taken'>;
};

export type ListData<TItem> = {
  items: TItem[];
};

export type IdResponse = {
  id?: Uuid;
  userId?: Uuid;
};