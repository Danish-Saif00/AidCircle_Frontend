import React, {useMemo, useState} from 'react';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  FileWarning,
  RefreshCcw,
  Save,
  ShieldAlert,
  User,
  UserX,
} from 'lucide-react-native';

import type {AdminScreenProps} from '../../navigation/navigation.types';
import {
  reportsApi,
  type Report,
  type UpdateReportStatusRequest,
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

type AdminReportDetailScreenProps = AdminScreenProps<'AdminReportDetail'>;

type ReportRecord = Report & Record<string, unknown>;

type AdminReportStatus = 'reviewed' | 'dismissed' | 'action_taken';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const statusOptions: {
  label: string;
  value: AdminReportStatus;
  description: string;
}[] = [
  {
    label: 'Reviewed',
    value: 'reviewed',
    description: 'Mark this report as reviewed without taking action.',
  },
  {
    label: 'Dismissed',
    value: 'dismissed',
    description: 'Dismiss this report if no action is required.',
  },
  {
    label: 'Action Taken',
    value: 'action_taken',
    description: 'Use when admin action has been taken after review.',
  },
];

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

const getNullableStringValue = (
  source: ReportRecord,
  key: string,
): string | null => {
  const value = source[key];

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

const getReportId = (report: Report): string => {
  return getStringValue(report as ReportRecord, 'id');
};

const getReportReason = (report: Report): string => {
  return getStringValue(report as ReportRecord, 'reason', 'Report submitted');
};

const getReportDescription = (report: Report): string | null => {
  return getNullableStringValue(report as ReportRecord, 'description');
};

const getReportStatus = (report: Report): string => {
  return getStringValue(report as ReportRecord, 'status', 'pending');
};

const getReportCreatedAt = (report: Report): string | null => {
  return getNullableStringValue(report as ReportRecord, 'createdAt');
};

const getReportReviewedAt = (report: Report): string | null => {
  return getNullableStringValue(report as ReportRecord, 'reviewedAt');
};

const getReportReviewedBy = (report: Report): string | null => {
  return getNullableStringValue(report as ReportRecord, 'reviewedBy');
};

const getReportReporterId = (report: Report): string | null => {
  const record = report as ReportRecord;

  return (
    getNullableStringValue(record, 'reporterId') ||
    getNullableStringValue(record, 'createdBy') ||
    getNullableStringValue(record, 'userId')
  );
};

const getReportTargetType = (report: Report): 'emergency' | 'user' | 'report' => {
  const record = report as ReportRecord;

  const explicitTargetType = getNullableStringValue(record, 'targetType');

  if (explicitTargetType === 'emergency' || explicitTargetType === 'user') {
    return explicitTargetType;
  }

  if (getNullableStringValue(record, 'emergencyId')) {
    return 'emergency';
  }

  if (
    getNullableStringValue(record, 'reportedUserId') ||
    getNullableStringValue(record, 'targetUserId')
  ) {
    return 'user';
  }

  return 'report';
};

const getReportTargetId = (report: Report): string | null => {
  const record = report as ReportRecord;

  return (
    getNullableStringValue(record, 'emergencyId') ||
    getNullableStringValue(record, 'reportedUserId') ||
    getNullableStringValue(record, 'targetUserId') ||
    getNullableStringValue(record, 'targetId')
  );
};

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

const formatStatusLabel = (status: string): string => {
  return status.replace('_', ' ').toUpperCase();
};

const getStatusTone = (status: string): BadgeTone => {
  switch (status) {
    case 'reviewed':
      return 'info';

    case 'action_taken':
      return 'success';

    case 'dismissed':
      return 'neutral';

    case 'pending':
    default:
      return 'warning';
  }
};

const getTargetTone = (targetType: string): BadgeTone => {
  if (targetType === 'emergency') {
    return 'danger';
  }

  if (targetType === 'user') {
    return 'warning';
  }

  return 'neutral';
};

const shortenId = (id: string | null): string => {
  if (!id) {
    return 'Not available';
  }

  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
};

export const AdminReportDetailScreen = ({
  navigation,
  route,
}: AdminReportDetailScreenProps) => {
  const {reportId} = route.params;

  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] =
    useState<AdminReportStatus | null>(null);

  const reportsQuery = useQuery({
    queryKey: ['reports', 'admin'],
    queryFn: reportsApi.adminListReports,
  });

  const reports = (reportsQuery.data ?? []) as Report[];

  const report = useMemo(() => {
    return reports.find(item => getReportId(item) === reportId);
  }, [reportId, reports]);

  const currentStatus = report ? getReportStatus(report) : 'pending';
  const resolvedStatus = selectedStatus ?? currentStatus;
  const targetType = report ? getReportTargetType(report) : 'report';
  const targetId = report ? getReportTargetId(report) : null;
  const reporterId = report ? getReportReporterId(report) : null;
  const hasChanges = Boolean(report && selectedStatus && selectedStatus !== currentStatus);

  const updateStatusMutation = useMutation({
    mutationFn: (payload: UpdateReportStatusRequest) =>
      reportsApi.adminUpdateReportStatus(reportId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['reports', 'admin'],
      });

      await queryClient.invalidateQueries({
        queryKey: ['reports', 'me'],
      });

      Alert.alert('Report updated', 'Report status has been updated.');

      setSelectedStatus(null);

      await reportsQuery.refetch();
    },
    onError: error => {
      Alert.alert(
        'Update failed',
        getApiErrorMessage(
          error,
          'Unable to update report status right now.',
        ),
      );
    },
  });

  const handleRefresh = async () => {
    await reportsQuery.refetch();
  };

  const handleSave = () => {
    if (!selectedStatus || !hasChanges) {
      return;
    }

    const payload = {
      status: selectedStatus,
    } as UpdateReportStatusRequest;

    updateStatusMutation.mutate(payload);
  };

  const handleOpenTarget = () => {
    if (!targetId || targetType === 'report') {
      Alert.alert('Target unavailable', 'This report target is not available.');
      return;
    }

    if (targetType === 'emergency') {
      navigation.getParent()?.getParent()?.dispatch(
        CommonActions.navigate({
          name: 'LiveSosStatus',
          params: {
            emergencyId: targetId,
          },
        }),
      );
      return;
    }

    navigation.getParent()?.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'PublicUserProfile',
        params: {
          userId: targetId,
        },
      }),
    );
  };

  const handleOpenReporter = () => {
    if (!reporterId) {
      Alert.alert('Reporter unavailable', 'Reporter user ID is not available.');
      return;
    }

    navigation.getParent()?.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'PublicUserProfile',
        params: {
          userId: reporterId,
        },
      }),
    );
  };

  if (reportsQuery.isLoading) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Report Detail"
          subtitle="Loading report"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
        />

        <LoadingState
          title="Loading report"
          message="Getting admin report details..."
          fullScreen
        />
      </Screen>
    );
  }

  if (reportsQuery.isError || !report) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Report Detail"
          subtitle="Unable to load"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
          rightAction={{
            accessibilityLabel: 'Retry report detail',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void handleRefresh();
            },
          }}
        />

        <ErrorState
          title="Report unavailable"
          message="This report could not be loaded from the admin report queue."
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
        title="Report Detail"
        subtitle="Admin review action"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh report detail',
          disabled: reportsQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={reportsQuery.isRefetching ? colors.onDisabled : colors.onSurface}
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      <View style={styles.content}>
        <Card
          variant={currentStatus === 'pending' ? 'danger' : 'outlined'}
          style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            {targetType === 'emergency' ? (
              <ShieldAlert
                color={
                  currentStatus === 'pending'
                    ? colors.onErrorContainer
                    : colors.primary
                }
                size={36}
              />
            ) : targetType === 'user' ? (
              <UserX
                color={
                  currentStatus === 'pending'
                    ? colors.onErrorContainer
                    : colors.primary
                }
                size={36}
              />
            ) : (
              <FileWarning
                color={
                  currentStatus === 'pending'
                    ? colors.onErrorContainer
                    : colors.primary
                }
                size={36}
              />
            )}
          </View>

          <Text
            variant="headingSmall"
            color={currentStatus === 'pending' ? 'onErrorContainer' : 'onSurface'}
            align="center"
            style={styles.heroTitle}>
            {getReportReason(report)}
          </Text>

          <View style={styles.heroBadges}>
            <StatusBadge
              label={formatStatusLabel(currentStatus)}
              tone={getStatusTone(currentStatus)}
              dot={currentStatus === 'pending'}
            />

            <StatusBadge
              label={targetType.toUpperCase()}
              tone={getTargetTone(targetType)}
            />
          </View>

          <Text
            variant="bodySmall"
            color={
              currentStatus === 'pending'
                ? 'onErrorContainer'
                : 'onSurfaceVariant'
            }
            align="center"
            style={styles.heroText}>
            {getReportDescription(report) || 'No additional details were added.'}
          </Text>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FileWarning color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Report Information
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailColumn}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Reason
              </Text>

              <Text
                variant="labelLarge"
                color="onSurface"
                style={styles.detailText}>
                {getReportReason(report)}
              </Text>
            </View>

            <View style={styles.detailColumn}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Description
              </Text>

              <Text
                variant="bodyMedium"
                color="onSurface"
                style={styles.detailText}>
                {getReportDescription(report) || 'No description was provided.'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Report ID
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {shortenId(getReportId(report))}
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clock color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Review Timeline
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Submitted
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(getReportCreatedAt(report))}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Reviewed
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(getReportReviewedAt(report))}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Reviewed By
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {shortenId(getReportReviewedBy(report))}
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <AlertTriangle color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Target & Reporter
            </Text>
          </View>

          <View style={styles.targetBox}>
            <View style={styles.targetIconWrap}>
              {targetType === 'emergency' ? (
                <ShieldAlert color={colors.primary} size={24} />
              ) : (
                <UserX color={colors.primary} size={24} />
              )}
            </View>

            <View style={styles.targetContent}>
              <Text variant="labelLarge" color="onSurface">
                Report Target
              </Text>

              <Text
                variant="bodySmall"
                color="onSurfaceVariant"
                style={styles.targetText}>
                {targetType.toUpperCase()} · {shortenId(targetId)}
              </Text>
            </View>
          </View>

          <View style={styles.targetBox}>
            <View style={styles.targetIconWrap}>
              <User color={colors.primary} size={24} />
            </View>

            <View style={styles.targetContent}>
              <Text variant="labelLarge" color="onSurface">
                Reporter
              </Text>

              <Text
                variant="bodySmall"
                color="onSurfaceVariant"
                style={styles.targetText}>
                {shortenId(reporterId)}
              </Text>
            </View>
          </View>

          <View style={styles.targetActions}>
            <Button
              title="Open Target"
              fullWidth
              variant="outline"
              disabled={!targetId || targetType === 'report'}
              onPress={handleOpenTarget}
            />

            <Button
              title="Open Reporter"
              fullWidth
              variant="outline"
              disabled={!reporterId}
              onPress={handleOpenReporter}
              style={styles.targetActionGap}
            />
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Update Report Status
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.sectionDescription}>
            Choose the final admin review status for this report.
          </Text>

          <View style={styles.statusList}>
            {statusOptions.map(option => {
              const selected = resolvedStatus === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Set report status ${option.label}`}
                  onPress={() => setSelectedStatus(option.value)}
                  style={[
                    styles.statusCard,
                    selected && styles.statusCardSelected,
                  ]}>
                  <View
                    style={[
                      styles.statusCheck,
                      selected && styles.statusCheckSelected,
                    ]}>
                    {selected ? <Check color={colors.onPrimary} size={18} /> : null}
                  </View>

                  <View style={styles.statusContent}>
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
                      style={styles.statusDescription}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Save Report Status"
            fullWidth
            size="lg"
            loading={updateStatusMutation.isPending}
            disabled={!hasChanges || updateStatusMutation.isPending}
            leftIcon={
              <Save
                color={hasChanges ? colors.onPrimary : colors.onDisabled}
                size={20}
              />
            }
            onPress={handleSave}
          />

          <Button
            title="Back to Reports"
            fullWidth
            size="lg"
            variant="outline"
            disabled={updateStatusMutation.isPending}
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
  heroIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  heroTitle: {
    marginTop: spacing.md,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  heroText: {
    marginTop: spacing.sm,
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
  detailColumn: {
    gap: spacing.xs,
  },
  detailText: {
    marginTop: spacing.xxs,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  targetBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  targetIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  targetContent: {
    flex: 1,
  },
  targetText: {
    marginTop: spacing.xs,
  },
  targetActions: {
    marginTop: spacing.lg,
  },
  targetActionGap: {
    marginTop: spacing.md,
  },
  statusList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  statusCardSelected: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.primary,
  },
  statusCheck: {
    alignItems: 'center',
    backgroundColor: colors.outline,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  statusCheckSelected: {
    backgroundColor: colors.primary,
  },
  statusContent: {
    flex: 1,
  },
  statusDescription: {
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