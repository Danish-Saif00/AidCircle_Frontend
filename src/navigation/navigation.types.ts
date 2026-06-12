import type {NavigatorScreenParams} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {EmergencyPriority, ResponderStatus} from '../config/constants';
import type {Uuid} from '../services/api';

export type ReportTargetType = 'emergency' | 'user';

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type AppStackParamList = {
  PermissionsSetup: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;

  SelectCategory: undefined;
  SosDetails: {
    categoryId: Uuid;
    categoryName: string;
    defaultPriority?: EmergencyPriority;
  };
  ConfirmSos: {
    categoryId: Uuid;
    categoryName: string;
    title: string;
    description?: string;
    priority?: EmergencyPriority;
  };
  LiveSosStatus: {
    emergencyId: Uuid;
  };

  EmergencyDetailHelper: {
    emergencyId: Uuid;
  };
  AcceptedEmergencyActive: {
    emergencyId: Uuid;
    responderId?: Uuid;
  };

  PublicUserProfile: {
    userId: Uuid;
  };
  CreateReport: {
    targetType: ReportTargetType;
    targetId: Uuid;
    contextTitle?: string;
  };

  AdminUserDetail: {
    userId: Uuid;
  };
  AdminReportDetail: {
    reportId: Uuid;
  };
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  NearbyTab: NavigatorScreenParams<HelperStackParamList>;
  ActivityTab: NavigatorScreenParams<ActivityStackParamList>;
  NotificationsTab: NavigatorScreenParams<NotificationsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  AdminTab: NavigatorScreenParams<AdminStackParamList> | undefined;
};

export type HomeStackParamList = {
  HomeMapSos: undefined;
};

export type HelperStackParamList = {
  NearbyEmergenciesMap: undefined;
  NearbyEmergenciesList: undefined;
  EmergencyDetailHelper: {
    emergencyId: Uuid;
  };
  AcceptedEmergencyActive: {
    emergencyId: Uuid;
    responderId?: Uuid;
    initialStatus?: ResponderStatus;
  };
  MyActiveResponses: undefined;
  MyResponseHistory: undefined;
};

export type ActivityStackParamList = {
  MyEmergencyHistory: undefined;
  MyActiveResponses: undefined;
  MyResponseHistory: undefined;
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  NotificationDetail: {
    notificationId: Uuid;
    emergencyId?: Uuid | null;
  };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  PublicUserProfile: {
    userId: Uuid;
  };
  MyReports: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminUsersList: undefined;
  AdminUserDetail: {
    userId: Uuid;
  };
  AdminReportsQueue: undefined;
  AdminReportDetail: {
    reportId: Uuid;
  };
};

export type RootScreenProps<TScreen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, TScreen>;

export type AuthScreenProps<TScreen extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, TScreen>;

export type AppScreenProps<TScreen extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, TScreen>;

export type MainTabScreenProps<TScreen extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, TScreen>;

export type HomeScreenProps<TScreen extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, TScreen>;

export type HelperScreenProps<TScreen extends keyof HelperStackParamList> =
  NativeStackScreenProps<HelperStackParamList, TScreen>;

export type ActivityScreenProps<TScreen extends keyof ActivityStackParamList> =
  NativeStackScreenProps<ActivityStackParamList, TScreen>;

export type NotificationsScreenProps<
  TScreen extends keyof NotificationsStackParamList,
> = NativeStackScreenProps<NotificationsStackParamList, TScreen>;

export type ProfileScreenProps<TScreen extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, TScreen>;

export type AdminScreenProps<TScreen extends keyof AdminStackParamList> =
  NativeStackScreenProps<AdminStackParamList, TScreen>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}