import React, {useMemo, useState} from 'react';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react-native';

import {USER_ROLES} from '../../config/constants';
import type {AdminScreenProps} from '../../navigation/navigation.types';
import {
  usersApi,
  type AdminUpdateUserRequest,
  type UserProfile,
} from '../../services/api';
import {
  Button,
  Card,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  StatusBadge,
  Text,
} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';

type AdminUserDetailScreenProps = AdminScreenProps<'AdminUserDetail'>;

type EditableRole = 'user' | 'helper' | 'admin';

const roleOptions: {label: string; value: EditableRole; description: string}[] =
  [
    {
      label: 'User',
      value: USER_ROLES.USER,
      description: 'Can create SOS alerts and use normal app features.',
    },
    {
      label: 'Helper',
      value: USER_ROLES.HELPER,
      description: 'Can respond to nearby emergency alerts.',
    },
    {
      label: 'Admin',
      value: USER_ROLES.ADMIN,
      description: 'Can access admin moderation screens.',
    },
  ];

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
    hour: '2-digit',
    minute: '2-digit',
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

const getRoleTone = (
  role: UserProfile['role'],
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  if (role === USER_ROLES.ADMIN) {
    return 'danger';
  }

  if (role === USER_ROLES.HELPER) {
    return 'success';
  }

  return 'info';
};

const normalizeEditableRole = (role: UserProfile['role']): EditableRole => {
  if (role === USER_ROLES.ADMIN) {
    return USER_ROLES.ADMIN;
  }

  if (role === USER_ROLES.HELPER) {
    return USER_ROLES.HELPER;
  }

  return USER_ROLES.USER;
};

export const AdminUserDetailScreen = ({
  navigation,
  route,
}: AdminUserDetailScreenProps) => {
  const {userId} = route.params;

  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: usersApi.adminListUsers,
  });

  const users = (usersQuery.data ?? []) as UserProfile[];

  const user = useMemo(() => {
    return users.find(item => item.id === userId);
  }, [userId, users]);

  const [selectedRole, setSelectedRole] = useState<EditableRole | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isHelperAvailable, setIsHelperAvailable] = useState<boolean | null>(
    null,
  );

  const resolvedRole = selectedRole ?? (user ? normalizeEditableRole(user.role) : USER_ROLES.USER);
  const resolvedVerified = isVerified ?? user?.isVerified ?? false;
  const resolvedHelperAvailable =
    isHelperAvailable ?? user?.isHelperAvailable ?? false;

  const hasChanges = Boolean(
    user &&
      (resolvedRole !== normalizeEditableRole(user.role) ||
        resolvedVerified !== user.isVerified ||
        resolvedHelperAvailable !== user.isHelperAvailable),
  );

  const updateUserMutation = useMutation({
    mutationFn: (payload: AdminUpdateUserRequest) =>
      usersApi.adminUpdateUser(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['users', 'admin'],
      });

      Alert.alert('User updated', 'User account has been updated.');

      setSelectedRole(null);
      setIsVerified(null);
      setIsHelperAvailable(null);
    },
    onError: error => {
      Alert.alert(
        'Update failed',
        getApiErrorMessage(error, 'Unable to update this user right now.'),
      );
    },
  });

  const handleRefresh = async () => {
    await usersQuery.refetch();
  };

  const handleSave = () => {
    if (!user || !hasChanges) {
      return;
    }

    const payload = {
      role: resolvedRole,
      isVerified: resolvedVerified,
      isHelperAvailable: resolvedHelperAvailable,
    } as AdminUpdateUserRequest;

    updateUserMutation.mutate(payload);
  };

  if (usersQuery.isLoading) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="User Detail"
          subtitle="Loading user"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
        />

        <LoadingState
          title="Loading user"
          message="Getting admin user details..."
          fullScreen
        />
      </Screen>
    );
  }

  if (usersQuery.isError || !user) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="User Detail"
          subtitle="Unable to load"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
          rightAction={{
            accessibilityLabel: 'Retry user detail',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void handleRefresh();
            },
          }}
        />

        <ErrorState
          title="User unavailable"
          message="This user could not be loaded from the admin user list."
          onRetry={() => {
            void handleRefresh();
          }}
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
        title="User Detail"
        subtitle="Admin account controls"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh user detail',
          disabled: usersQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={usersQuery.isRefetching ? colors.onDisabled : colors.onSurface}
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
              {getInitials(user.fullName)}
            </Text>
          </View>

          <Text
            variant="headingSmall"
            color="onSurface"
            align="center"
            style={styles.name}>
            {user.fullName}
          </Text>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            align="center"
            style={styles.email}>
            {user.email || 'No email available'}
          </Text>

          <View style={styles.badges}>
            <StatusBadge
              label={getRoleLabel(user.role)}
              tone={getRoleTone(user.role)}
              dot
            />

            <StatusBadge
              label={user.isVerified ? 'Verified' : 'Unverified'}
              tone={user.isVerified ? 'success' : 'warning'}
            />

            <StatusBadge
              label={user.isHelperAvailable ? 'Helper Available' : 'Helper Off'}
              tone={user.isHelperAvailable ? 'success' : 'neutral'}
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
              <View style={styles.detailLabelWrap}>
                <Mail color={colors.onSurfaceVariant} size={16} />

                <Text variant="bodySmall" color="onSurfaceVariant">
                  Email
                </Text>
              </View>

              <Text variant="labelMedium" color="onSurface" align="right">
                {user.email || 'Not available'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelWrap}>
                <Phone color={colors.onSurfaceVariant} size={16} />

                <Text variant="bodySmall" color="onSurfaceVariant">
                  Phone
                </Text>
              </View>

              <Text variant="labelMedium" color="onSurface" align="right">
                {user.phone || 'Not added'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Blood Group
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {user.bloodGroup || 'Not added'}
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
                {user.medicalNotes || 'No medical notes added.'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Joined
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(user.createdAt)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Updated
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(user.updatedAt)}
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Shield color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Role Management
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.sectionDescription}>
            Change the user role carefully. Admin users can access moderation
            screens.
          </Text>

          <View style={styles.roleList}>
            {roleOptions.map(option => {
              const selected = resolvedRole === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Set role ${option.label}`}
                  onPress={() => setSelectedRole(option.value)}
                  style={[styles.roleCard, selected && styles.roleCardSelected]}>
                  <View
                    style={[
                      styles.roleCheck,
                      selected && styles.roleCheckSelected,
                    ]}>
                    {selected ? <Check color={colors.onPrimary} size={18} /> : null}
                  </View>

                  <View style={styles.roleContent}>
                    <Text
                      variant="labelLarge"
                      color={selected ? 'onErrorContainer' : 'onSurface'}>
                      {option.label}
                    </Text>

                    <Text
                      variant="bodySmall"
                      color={
                        selected ? 'onErrorContainer' : 'onSurfaceVariant'
                      }
                      style={styles.roleDescription}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ShieldCheck color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Verification & Helper Status
            </Text>
          </View>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{checked: resolvedVerified}}
            onPress={() => setIsVerified(value => !(value ?? user.isVerified))}
            style={[
              styles.toggleCard,
              resolvedVerified && styles.toggleCardActive,
            ]}>
            <View
              style={[
                styles.toggleIcon,
                resolvedVerified && styles.toggleIconActive,
              ]}>
              {resolvedVerified ? (
                <Check color={colors.onPrimary} size={20} />
              ) : null}
            </View>

            <View style={styles.toggleContent}>
              <Text
                variant="labelLarge"
                color={resolvedVerified ? 'onErrorContainer' : 'onSurface'}>
                {resolvedVerified ? 'Verified User' : 'Unverified User'}
              </Text>

              <Text
                variant="bodySmall"
                color={
                  resolvedVerified ? 'onErrorContainer' : 'onSurfaceVariant'
                }
                style={styles.toggleDescription}>
                Controls whether the account appears verified.
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{checked: resolvedHelperAvailable}}
            onPress={() =>
              setIsHelperAvailable(value => !(value ?? user.isHelperAvailable))
            }
            style={[
              styles.toggleCard,
              resolvedHelperAvailable && styles.toggleCardActive,
            ]}>
            <View
              style={[
                styles.toggleIcon,
                resolvedHelperAvailable && styles.toggleIconActive,
              ]}>
              {resolvedHelperAvailable ? (
                <Check color={colors.onPrimary} size={20} />
              ) : null}
            </View>

            <View style={styles.toggleContent}>
              <Text
                variant="labelLarge"
                color={
                  resolvedHelperAvailable ? 'onErrorContainer' : 'onSurface'
                }>
                {resolvedHelperAvailable
                  ? 'Helper Available'
                  : 'Helper Unavailable'}
              </Text>

              <Text
                variant="bodySmall"
                color={
                  resolvedHelperAvailable
                    ? 'onErrorContainer'
                    : 'onSurfaceVariant'
                }
                style={styles.toggleDescription}>
                Controls whether the user is shown as available helper.
              </Text>
            </View>
          </Pressable>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Save User Changes"
            fullWidth
            size="lg"
            loading={updateUserMutation.isPending}
            disabled={!hasChanges || updateUserMutation.isPending}
            leftIcon={
              <Save
                color={hasChanges ? colors.onPrimary : colors.onDisabled}
                size={20}
              />
            }
            onPress={handleSave}
          />

          <Button
            title="Back to Users"
            fullWidth
            size="lg"
            variant="outline"
            disabled={updateUserMutation.isPending}
            onPress={navigation.goBack}
            style={styles.backButton}
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
  sectionDescription: {
    marginTop: spacing.sm,
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
  detailLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  detailColumn: {
    gap: spacing.xs,
  },
  detailText: {
    marginTop: spacing.xxs,
  },
  roleList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  roleCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  roleCardSelected: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.primary,
  },
  roleCheck: {
    alignItems: 'center',
    backgroundColor: colors.outline,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  roleCheckSelected: {
    backgroundColor: colors.primary,
  },
  roleContent: {
    flex: 1,
  },
  roleDescription: {
    marginTop: spacing.xs,
  },
  toggleCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  toggleCardActive: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.primary,
  },
  toggleIcon: {
    alignItems: 'center',
    backgroundColor: colors.outline,
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  toggleIconActive: {
    backgroundColor: colors.primary,
  },
  toggleContent: {
    flex: 1,
  },
  toggleDescription: {
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    marginTop: spacing.md,
  },
});