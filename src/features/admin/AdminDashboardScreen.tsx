import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react-native';

import {USER_ROLES} from '../../config/constants';
import type {AdminScreenProps} from '../../navigation/navigation.types';
import {
  reportsApi,
  usersApi,
  type Report,
  type UserProfile,
} from '../../services/api';
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
import {colors, radius, spacing} from '../../shared/theme';

type AdminDashboardScreenProps = AdminScreenProps<'AdminDashboard'>;

type ReportRecord = Report & Record<string, unknown>;

const getStringValue = (
  source: ReportRecord,
  key: string,
  fallback = '',
): string => {
  const value = source[key];

  if (typeof value === 'string') {
    return value;
  }

  return fallback;
};

const getReportStatus = (report: Report): string => {
  return getStringValue(report as ReportRecord, 'status', 'pending');
};

const getReportTargetType = (report: Report): string => {
  const record = report as ReportRecord;

  const targetType = getStringValue(record, 'targetType');

  if (targetType) {
    return targetType;
  }

  const emergencyId = getStringValue(record, 'emergencyId');
  const reportedUserId = getStringValue(record, 'reportedUserId');

  if (emergencyId) {
    return 'emergency';
  }

  if (reportedUserId) {
    return 'user';
  }

  return 'report';
};

const DashboardMetricCard = ({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) => {
  return (
    <Card variant="outlined" style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIconWrap}>{icon}</View>

        <StatusBadge label={String(value)} tone={tone} size="sm" />
      </View>

      <Text variant="headingMedium" color="onSurface" style={styles.metricValue}>
        {value}
      </Text>

      <Text variant="labelLarge" color="onSurface">
        {title}
      </Text>

      <Text
        variant="bodySmall"
        color="onSurfaceVariant"
        style={styles.metricDescription}>
        {description}
      </Text>
    </Card>
  );
};

const AdminActionCard = ({
  title,
  description,
  icon,
  badge,
  onPress,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
  onPress: () => void;
}) => {
  return (
    <PressableCard variant="outlined" onPress={onPress} style={styles.actionCard}>
      <View style={styles.actionIconWrap}>{icon}</View>

      <View style={styles.actionContent}>
        <View style={styles.actionHeader}>
          <Text variant="labelLarge" color="onSurface" style={styles.actionTitle}>
            {title}
          </Text>

          {badge}
        </View>

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

export const AdminDashboardScreen = ({
  navigation,
}: AdminDashboardScreenProps) => {
  const usersQuery = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: usersApi.adminListUsers,
  });

  const reportsQuery = useQuery({
    queryKey: ['reports', 'admin'],
    queryFn: reportsApi.adminListReports,
  });

  const users = (usersQuery.data ?? []) as UserProfile[];
  const reports = (reportsQuery.data ?? []) as Report[];

  const adminUsers = users.filter(user => user.role === USER_ROLES.ADMIN);
  const helpers = users.filter(user => user.role === USER_ROLES.HELPER);
  const verifiedUsers = users.filter(user => user.isVerified);

  const pendingReports = reports.filter(
    report => getReportStatus(report) === 'pending',
  );

  const emergencyReports = reports.filter(
    report => getReportTargetType(report) === 'emergency',
  );

  const userReports = reports.filter(
    report => getReportTargetType(report) === 'user',
  );

  const isLoading = usersQuery.isLoading || reportsQuery.isLoading;
  const isError = usersQuery.isError || reportsQuery.isError;
  const isRefreshing = usersQuery.isRefetching || reportsQuery.isRefetching;

  const handleRefresh = async () => {
    await Promise.all([usersQuery.refetch(), reportsQuery.refetch()]);
  };

  if (isLoading) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Admin Dashboard"
          subtitle="Loading admin overview"
          borderBottom
        />

        <LoadingState
          title="Loading dashboard"
          message="Getting users and reports..."
          fullScreen
        />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Admin Dashboard"
          subtitle="Unable to load"
          borderBottom
          rightAction={{
            accessibilityLabel: 'Retry admin dashboard',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void handleRefresh();
            },
          }}
        />

        <ErrorState
          title="Dashboard unavailable"
          message="Admin dashboard data could not be loaded right now."
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
        title="Admin Dashboard"
        subtitle="Users, reports, and moderation"
        borderBottom
        rightAction={{
          accessibilityLabel: 'Refresh admin dashboard',
          disabled: isRefreshing,
          icon: (
            <RefreshCcw
              color={isRefreshing ? colors.onDisabled : colors.onSurface}
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      <View style={styles.content}>
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <ShieldCheck color={colors.onPrimary} size={34} />
          </View>

          <View style={styles.heroContent}>
            <Text variant="headingSmall" color="onSurface">
              Admin Control Center
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.heroText}>
              Review platform users, pending reports, and moderation actions
              from one place.
            </Text>
          </View>

          <StatusBadge
            label={`${pendingReports.length} pending`}
            tone={pendingReports.length > 0 ? 'warning' : 'success'}
            size="sm"
          />
        </Card>

        <View style={styles.metricsGrid}>
          <DashboardMetricCard
            title="Total Users"
            value={users.length}
            description="Registered users in the platform."
            icon={<Users color={colors.primary} size={24} />}
            tone="info"
          />

          <DashboardMetricCard
            title="Helpers"
            value={helpers.length}
            description="Users marked as helper role."
            icon={<UserCheck color={colors.primary} size={24} />}
            tone="success"
          />

          <DashboardMetricCard
            title="Verified"
            value={verifiedUsers.length}
            description="Users verified by account status."
            icon={<CheckCircle2 color={colors.primary} size={24} />}
            tone="success"
          />

          <DashboardMetricCard
            title="Pending Reports"
            value={pendingReports.length}
            description="Reports waiting for admin review."
            icon={<AlertTriangle color={colors.primary} size={24} />}
            tone={pendingReports.length > 0 ? 'warning' : 'success'}
          />
        </View>

        <Card variant="outlined" style={styles.sectionCard}>
          <Text variant="labelLarge" color="onSurface">
            Report Breakdown
          </Text>

          <View style={styles.breakdownRows}>
            <View style={styles.breakdownRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Emergency Reports
              </Text>

              <StatusBadge
                label={String(emergencyReports.length)}
                tone={emergencyReports.length > 0 ? 'danger' : 'neutral'}
                size="sm"
              />
            </View>

            <View style={styles.breakdownRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                User Reports
              </Text>

              <StatusBadge
                label={String(userReports.length)}
                tone={userReports.length > 0 ? 'warning' : 'neutral'}
                size="sm"
              />
            </View>

            <View style={styles.breakdownRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Admin Users
              </Text>

              <StatusBadge
                label={String(adminUsers.length)}
                tone={adminUsers.length > 0 ? 'info' : 'neutral'}
                size="sm"
              />
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <AdminActionCard
            title="Manage Users"
            description="View user list, profile details, roles, and verification status."
            icon={<Users color={colors.primary} size={24} />}
            badge={
              <StatusBadge label={String(users.length)} tone="info" size="sm" />
            }
            onPress={() => navigation.navigate('AdminUsersList')}
          />

          <AdminActionCard
            title="Review Reports"
            description="Open submitted reports and update admin review status."
            icon={<FileWarning color={colors.primary} size={24} />}
            badge={
              <StatusBadge
                label={`${pendingReports.length} pending`}
                tone={pendingReports.length > 0 ? 'warning' : 'success'}
                size="sm"
              />
            }
            onPress={() => navigation.navigate('AdminReportsQueue')}
          />
        </View>

        <Button
          title="Refresh Dashboard"
          fullWidth
          variant="outline"
          loading={isRefreshing}
          disabled={isRefreshing}
          leftIcon={<RefreshCcw color={colors.primary} size={20} />}
          onPress={handleRefresh}
          style={styles.refreshButton}
        />
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
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  heroContent: {
    flex: 1,
  },
  heroText: {
    marginTop: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  metricCard: {
    flexBasis: '47%',
  },
  metricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  metricValue: {
    marginTop: spacing.md,
  },
  metricDescription: {
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginTop: spacing.lg,
  },
  breakdownRows: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  breakdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  actions: {
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
  actionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  actionTitle: {
    flex: 1,
  },
  actionDescription: {
    marginTop: spacing.xs,
  },
  refreshButton: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxl,
  },
});