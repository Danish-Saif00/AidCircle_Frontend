import React, {useMemo, useState} from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCcw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from 'lucide-react-native';

import {USER_ROLES} from '../../config/constants';
import type {AdminScreenProps} from '../../navigation/navigation.types';
import {usersApi, type UserProfile} from '../../services/api';
import {
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  PressableCard,
  Screen,
  StatusBadge,
  Text,
  TextInput,
} from '../../shared/components';
import {colors, radius, spacing} from '../../shared/theme';

type AdminUsersListScreenProps = AdminScreenProps<'AdminUsersList'>;

type RoleFilter = 'all' | 'user' | 'helper' | 'admin';

const roleFilters: {label: string; value: RoleFilter}[] = [
  {label: 'All', value: 'all'},
  {label: 'Users', value: 'user'},
  {label: 'Helpers', value: 'helper'},
  {label: 'Admins', value: 'admin'},
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

const AdminUserCard = ({
  user,
  onPress,
}: {
  user: UserProfile;
  onPress: () => void;
}) => {
  return (
    <PressableCard variant="outlined" onPress={onPress} style={styles.userCard}>
      <View style={styles.userTop}>
        <View style={styles.avatarCircle}>
          <Text variant="labelLarge" color="onPrimary">
            {getInitials(user.fullName)}
          </Text>
        </View>

        <View style={styles.userMain}>
          <View style={styles.userHeader}>
            <Text
              variant="labelLarge"
              color="onSurface"
              numberOfLines={1}
              style={styles.userName}>
              {user.fullName}
            </Text>

            <StatusBadge
              label={getRoleLabel(user.role)}
              tone={getRoleTone(user.role)}
              size="sm"
              dot
            />
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            numberOfLines={1}
            style={styles.email}>
            {user.email}
          </Text>
        </View>
      </View>

      <View style={styles.badges}>
        <StatusBadge
          label={user.isVerified ? 'Verified' : 'Unverified'}
          tone={user.isVerified ? 'success' : 'warning'}
          size="sm"
        />

        <StatusBadge
          label={user.isHelperAvailable ? 'Helper Available' : 'Helper Off'}
          tone={user.isHelperAvailable ? 'success' : 'neutral'}
          size="sm"
        />
      </View>

      <View style={styles.metaRows}>
        <View style={styles.metaRow}>
          <CheckCircle2 color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Joined {formatDateTime(user.createdAt)}
          </Text>
        </View>
      </View>
    </PressableCard>
  );
};

export const AdminUsersListScreen = ({
  navigation,
}: AdminUsersListScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const usersQuery = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: usersApi.adminListUsers,
  });

  const users = (usersQuery.data ?? []) as UserProfile[];

  const filteredUsers = useMemo(() => {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    const matchesSearch =
      normalizedSearch.length === 0 ||
      user.fullName.toLowerCase().includes(normalizedSearch) ||
      (user.email ?? '').toLowerCase().includes(normalizedSearch) ||
      (user.phone ?? '').toLowerCase().includes(normalizedSearch);

    return matchesRole && matchesSearch;
  });
}, [roleFilter, searchQuery, users]);

  const verifiedCount = users.filter(user => user.isVerified).length;
  const helperCount = users.filter(user => user.role === USER_ROLES.HELPER).length;
  const adminCount = users.filter(user => user.role === USER_ROLES.ADMIN).length;

  const handleOpenUser = (user: UserProfile) => {
    navigation.navigate('AdminUserDetail', {
      userId: user.id,
    });
  };

  const renderUser: ListRenderItem<UserProfile> = ({item}) => {
    return <AdminUserCard user={item} onPress={() => handleOpenUser(item)} />;
  };

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Admin Users"
        subtitle={`${filteredUsers.length} user${
          filteredUsers.length === 1 ? '' : 's'
        } shown`}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh users',
          disabled: usersQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={usersQuery.isRefetching ? colors.onDisabled : colors.onSurface}
              size={22}
            />
          ),
          onPress: () => {
            void usersQuery.refetch();
          },
        }}
      />

      <View style={styles.summaryWrap}>
        <Card variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Users color={colors.primary} size={24} />
          </View>

          <View style={styles.summaryContent}>
            <Text variant="labelLarge" color="onSurface">
              User Management
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              Review users, helper status, verification state, and account role.
            </Text>
          </View>

          <StatusBadge label={String(users.length)} tone="info" size="sm" />
        </Card>

        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <ShieldCheck color={colors.primary} size={22} />

            <Text variant="headingSmall" color="onSurface" style={styles.statValue}>
              {verifiedCount}
            </Text>

            <Text variant="caption" color="onSurfaceVariant">
              Verified
            </Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <UserCheck color={colors.primary} size={22} />

            <Text variant="headingSmall" color="onSurface" style={styles.statValue}>
              {helperCount}
            </Text>

            <Text variant="caption" color="onSurfaceVariant">
              Helpers
            </Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <ShieldCheck color={colors.primary} size={22} />

            <Text variant="headingSmall" color="onSurface" style={styles.statValue}>
              {adminCount}
            </Text>

            <Text variant="caption" color="onSurfaceVariant">
              Admins
            </Text>
          </Card>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            label="Search Users"
            placeholder="Search by name, email, or phone"
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search color={colors.onSurfaceVariant} size={20} />}
          />
        </View>

        <View style={styles.filterRow}>
          {roleFilters.map(filter => {
            const selected = roleFilter === filter.value;

            return (
              <PressableCard
                key={filter.value}
                variant={selected ? 'elevated' : 'outlined'}
                onPress={() => setRoleFilter(filter.value)}
                style={styles.filterCard}>
                <Text
                  variant="labelMedium"
                  color={selected ? 'primary' : 'onSurface'}
                  align="center">
                  {filter.label}
                </Text>
              </PressableCard>
            );
          })}
        </View>
      </View>

      {usersQuery.isLoading ? (
        <LoadingState
          title="Loading users"
          message="Getting registered platform users..."
          fullScreen
        />
      ) : usersQuery.isError ? (
        <ErrorState
          title="Unable to load users"
          message="Admin user list could not be loaded right now."
          onRetry={() => {
            void usersQuery.refetch();
          }}
          fullScreen
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          contentContainerStyle={[
            styles.listContent,
            filteredUsers.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={usersQuery.isRefetching}
              onRefresh={() => {
                void usersQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No users found"
              message="No users match the selected search or role filter."
              icon={<User color={colors.onSurfaceVariant} size={34} />}
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  summaryWrap: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.screenVertical,
  },
  summaryCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  summaryContent: {
    flex: 1,
  },
  summaryText: {
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    marginTop: spacing.sm,
  },
  searchWrap: {
    marginTop: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterCard: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: spacing.md,
  },
  userCard: {
    gap: spacing.md,
  },
  userTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  userMain: {
    flex: 1,
  },
  userHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  userName: {
    flex: 1,
  },
  email: {
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaRows: {
    gap: spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
});