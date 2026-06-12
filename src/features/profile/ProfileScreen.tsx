import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  Edit3,
  FileText,
  HeartPulse,
  History,
  LogOut,
  RefreshCcw,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react-native';

import {USER_ROLES} from '../../config/constants';
import type {ProfileScreenProps} from '../../navigation/navigation.types';
import {authApi, usersApi, type UserProfile} from '../../services/api';
import {
  Button,
  Card,
  ErrorState,
  Header,
  LoadingState,
  PressableCard,
  Screen,
  StatusBadge,
  Text,
} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';
import {useAuthStore} from '../../store';

type ProfileScreenComponentProps = ProfileScreenProps<'Profile'>;

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const getRoleLabel = (role: UserProfile['role']): string => {
  return role.replace('_', ' ').toUpperCase();
};

const ProfileActionCard = ({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => {
  return (
    <PressableCard variant="outlined" onPress={onPress} style={styles.actionCard}>
      <View style={styles.actionIconWrap}>{icon}</View>

      <View style={styles.actionContent}>
        <Text variant="labelLarge" color="onSurface">
          {title}
        </Text>

        <Text
          variant="bodySmall"
          color="onSurfaceVariant"
          style={styles.actionDescription}>
          {description}
        </Text>
      </View>
    </PressableCard>
  );
};

export const ProfileScreen = ({navigation}: ProfileScreenComponentProps) => {
  const queryClient = useQueryClient();

  const storedProfile = useAuthStore(state => state.profile);
  const clearSession = useAuthStore(state => state.clearSession);
  const updateProfile = useAuthStore(state => state.updateProfile);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    initialData: storedProfile ?? undefined,
  });

  const profile = profileQuery.data;

  const isAdmin = useMemo(() => {
  return profile?.role === USER_ROLES.ADMIN;
}, [profile?.role]);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      setIsLoggingOut(true);

      await queryClient.clear();
      await clearSession();

      navigation.getParent()?.getParent()?.getParent()?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Auth',
              params: {
                screen: 'Welcome',
              },
            },
          ],
        }),
      );

      setIsLoggingOut(false);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: usersApi.deleteMe,
    onSuccess: async () => {
      Alert.alert(
        'Account deleted',
        'Your AidCircle account has been deleted.',
      );

      await queryClient.clear();
      await clearSession();

      navigation.getParent()?.getParent()?.getParent()?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Auth',
              params: {
                screen: 'Welcome',
              },
            },
          ],
        }),
      );
    },
    onError: error => {
      Alert.alert(
        'Delete failed',
        getApiErrorMessage(
          error,
          'Your account could not be deleted right now.',
        ),
      );
    },
  });

  const handleRefresh = async () => {
    const result = await profileQuery.refetch();

    if (result.data) {
      updateProfile(result.data);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout?', 'You will be signed out from this device.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logoutMutation.mutate(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This action cannot be undone. Your profile and account access will be removed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ],
    );
  };

  if (profileQuery.isLoading && !profile) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header title="Profile" subtitle="Loading account" borderBottom />

        <LoadingState
          title="Loading profile"
          message="Getting your account details..."
          fullScreen
        />
      </Screen>
    );
  }

  if (profileQuery.isError && !profile) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Profile"
          subtitle="Unable to load"
          borderBottom
          rightAction={{
            accessibilityLabel: 'Retry profile',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void profileQuery.refetch();
            },
          }}
        />

        <ErrorState
          title="Profile unavailable"
          message="Your profile could not be loaded right now."
          onRetry={() => {
            void profileQuery.refetch();
          }}
          fullScreen
        />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header title="Profile" subtitle="No account data" borderBottom />

        <ErrorState
          title="No profile found"
          message="Your account profile is not available."
          fullScreen
        />
      </Screen>
    );
  }

  return (
    <Screen
      safeArea
      scrollable
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Profile"
        subtitle="Account and safety settings"
        borderBottom
        rightAction={{
          accessibilityLabel: 'Refresh profile',
          disabled: profileQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                profileQuery.isRefetching
                  ? colors.onDisabled
                  : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      <View style={styles.content}>
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text variant="headingMedium" color="onPrimary">
              {getInitials(profile.fullName)}
            </Text>
          </View>

          <Text
            variant="headingSmall"
            color="onSurface"
            align="center"
            style={styles.name}>
            {profile.fullName}
          </Text>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            align="center"
            style={styles.email}>
            {profile.email}
          </Text>

          <View style={styles.badges}>
            <StatusBadge
              label={getRoleLabel(profile.role)}
              tone={isAdmin ? 'danger' : 'info'}
              dot
            />

            <StatusBadge
              label={profile.isVerified ? 'Verified' : 'Unverified'}
              tone={profile.isVerified ? 'success' : 'warning'}
            />

            <StatusBadge
              label={profile.isHelperAvailable ? 'Helper Available' : 'Helper Off'}
              tone={profile.isHelperAvailable ? 'success' : 'neutral'}
            />
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Account Information
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Phone
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {profile.phone || 'Not added'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Blood Group
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {profile.bloodGroup || 'Not added'}
              </Text>
            </View>

            <View style={styles.detailColumn}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Medical Notes
              </Text>

              <Text
                variant="bodyMedium"
                color="onSurface"
                style={styles.detailText}>
                {profile.medicalNotes || 'No medical notes added.'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Joined
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(profile.createdAt)}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.actionsGrid}>
          <ProfileActionCard
            title="Edit Profile"
            description="Update name, helper status, blood group, and medical notes."
            icon={<Edit3 color={colors.primary} size={24} />}
            onPress={() => navigation.navigate('EditProfile')}
          />

          <ProfileActionCard
            title="My SOS History"
            description="View emergencies you created."
            icon={<History color={colors.primary} size={24} />}
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({
                  name: 'ActivityTab',
                  params: {
                    screen: 'MyEmergencyHistory',
                  },
                }),
              )
            }
          />

          <ProfileActionCard
            title="Active Responses"
            description="Manage emergencies you accepted as a helper."
            icon={<UserCheck color={colors.primary} size={24} />}
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({
                  name: 'NearbyTab',
                  params: {
                    screen: 'MyActiveResponses',
                  },
                }),
              )
            }
          />

          <ProfileActionCard
            title="Response History"
            description="Review your past emergency responses."
            icon={<HeartPulse color={colors.primary} size={24} />}
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({
                  name: 'NearbyTab',
                  params: {
                    screen: 'MyResponseHistory',
                  },
                }),
              )
            }
          />

          <ProfileActionCard
            title="My Reports"
            description="Track reports you submitted for users or emergencies."
            icon={<FileText color={colors.primary} size={24} />}
            onPress={() => navigation.navigate('MyReports')}
          />

          <ProfileActionCard
            title="Notifications"
            description="Open emergency updates and system notifications."
            icon={<Bell color={colors.primary} size={24} />}
            onPress={() =>
              navigation.getParent()?.dispatch(
                CommonActions.navigate({
                  name: 'NotificationsTab',
                  params: {
                    screen: 'NotificationsList',
                  },
                }),
              )
            }
          />

          {isAdmin ? (
            <ProfileActionCard
              title="Admin Dashboard"
              description="Review users, reports, and moderation actions."
              icon={<ShieldCheck color={colors.primary} size={24} />}
              onPress={() =>
                navigation.getParent()?.dispatch(
                  CommonActions.navigate({
                    name: 'AdminTab',
                    params: {
                      screen: 'AdminDashboard',
                    },
                  }),
                )
              }
            />
          ) : null}
        </View>

        <Card variant="outlined" style={styles.safetyCard}>
          <View style={styles.sectionHeader}>
            <Shield color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Safety Notice
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.safetyText}>
            AidCircle helps connect nearby people during emergencies, but it
            does not replace official emergency services.
          </Text>
        </Card>

        <View style={styles.dangerActions}>
          <Button
            title="Logout"
            fullWidth
            size="lg"
            variant="outline"
            loading={logoutMutation.isPending || isLoggingOut}
            disabled={
              logoutMutation.isPending ||
              deleteAccountMutation.isPending ||
              isLoggingOut
            }
            leftIcon={<LogOut color={colors.primary} size={20} />}
            onPress={handleLogout}
          />

          <Button
            title="Delete Account"
            fullWidth
            size="lg"
            variant="danger"
            loading={deleteAccountMutation.isPending}
            disabled={
              logoutMutation.isPending ||
              deleteAccountMutation.isPending ||
              isLoggingOut
            }
            leftIcon={<AlertTriangle color={colors.onDanger} size={20} />}
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.screenVertical,
  },
  heroCard: {
    alignItems: 'center',
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  name: {
    marginTop: spacing.md,
  },
  email: {
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  sectionCard: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  detailColumn: {
    gap: spacing.xs,
  },
  detailText: {
    marginTop: spacing.xxs,
  },
  actionsGrid: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    marginTop: spacing.xs,
  },
  safetyCard: {
    marginTop: spacing.lg,
  },
  safetyText: {
    marginTop: spacing.md,
  },
  dangerActions: {
    marginTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
});