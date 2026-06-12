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
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileWarning,
  RefreshCcw,
  Search,
  ShieldAlert,
  UserX,
} from 'lucide-react-native';

import type {AdminScreenProps} from '../../navigation/navigation.types';
import {reportsApi, type Report} from '../../services/api';
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

type AdminReportsQueueScreenProps = AdminScreenProps<'AdminReportsQueue'>;

type ReportRecord = Report & Record<string, unknown>;
type ReportStatusFilter = 'all' | 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
type ReportTargetFilter = 'all' | 'emergency' | 'user';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const statusFilters: {label: string; value: ReportStatusFilter}[] = [
  {label: 'All', value: 'all'},
  {label: 'Pending', value: 'pending'},
  {label: 'Reviewed', value: 'reviewed'},
  {label: 'Action', value: 'action_taken'},
  {label: 'Dismissed', value: 'dismissed'},
];

const targetFilters: {label: string; value: ReportTargetFilter}[] = [
  {label: 'All', value: 'all'},
  {label: 'Emergency', value: 'emergency'},
  {label: 'User', value: 'user'},
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

const getReportReporterId = (report: Report): string | null => {
  return (
    getNullableStringValue(report as ReportRecord, 'reporterId') ||
    getNullableStringValue(report as ReportRecord, 'createdBy') ||
    getNullableStringValue(report as ReportRecord, 'userId')
  );
};

const getReportTargetType = (report: Report): ReportTargetFilter | 'report' => {
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

const AdminReportCard = ({
  report,
  onPress,
}: {
  report: Report;
  onPress: () => void;
}) => {
  const status = getReportStatus(report);
  const targetType = getReportTargetType(report);
  const description = getReportDescription(report);
  const targetId = getReportTargetId(report);
  const reporterId = getReportReporterId(report);
  const reviewedAt = getReportReviewedAt(report);

  return (
    <PressableCard variant="outlined" onPress={onPress} style={styles.reportCard}>
      <View style={styles.reportTop}>
        <View style={styles.iconWrap}>
          {targetType === 'emergency' ? (
            <ShieldAlert color={colors.primary} size={26} />
          ) : targetType === 'user' ? (
            <UserX color={colors.primary} size={26} />
          ) : (
            <FileWarning color={colors.primary} size={26} />
          )}
        </View>

        <View style={styles.reportMain}>
          <View style={styles.reportHeader}>
            <Text
              variant="labelLarge"
              color="onSurface"
              numberOfLines={1}
              style={styles.reportTitle}>
              {getReportReason(report)}
            </Text>

            <StatusBadge
              label={formatStatusLabel(status)}
              tone={getStatusTone(status)}
              size="sm"
              dot={status === 'pending'}
            />
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            numberOfLines={2}
            style={styles.description}>
            {description || 'No additional details were added.'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRows}>
        <View style={styles.metaRow}>
          <Clock color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Submitted {formatDateTime(getReportCreatedAt(report))}
          </Text>
        </View>

        {reviewedAt ? (
          <View style={styles.metaRow}>
            <CheckCircle2 color={colors.onSurfaceVariant} size={16} />

            <Text variant="caption" color="onSurfaceVariant">
              Reviewed {formatDateTime(reviewedAt)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.idRows}>
        <Text variant="caption" color="onSurfaceVariant">
          Target: {shortenId(targetId)}
        </Text>

        <Text variant="caption" color="onSurfaceVariant">
          Reporter: {shortenId(reporterId)}
        </Text>
      </View>

      <View style={styles.footer}>
        <StatusBadge
          label={targetType.toUpperCase()}
          tone={getTargetTone(targetType)}
          size="sm"
        />

        <Text variant="caption" color="onSurfaceVariant">
          ID: {shortenId(getReportId(report))}
        </Text>
      </View>
    </PressableCard>
  );
};

export const AdminReportsQueueScreen = ({
  navigation,
}: AdminReportsQueueScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
  const [targetFilter, setTargetFilter] = useState<ReportTargetFilter>('all');

  const reportsQuery = useQuery({
    queryKey: ['reports', 'admin'],
    queryFn: reportsApi.adminListReports,
  });

  const reports = (reportsQuery.data ?? []) as Report[];

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return reports.filter(report => {
      const status = getReportStatus(report);
      const targetType = getReportTargetType(report);
      const reason = getReportReason(report).toLowerCase();
      const description = (getReportDescription(report) ?? '').toLowerCase();
      const reportId = getReportId(report).toLowerCase();
      const targetId = (getReportTargetId(report) ?? '').toLowerCase();

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      const matchesTarget =
        targetFilter === 'all' || targetType === targetFilter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        reason.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        reportId.includes(normalizedSearch) ||
        targetId.includes(normalizedSearch);

      return matchesStatus && matchesTarget && matchesSearch;
    });
  }, [reports, searchQuery, statusFilter, targetFilter]);

  const pendingCount = reports.filter(
    report => getReportStatus(report) === 'pending',
  ).length;

  const emergencyCount = reports.filter(
    report => getReportTargetType(report) === 'emergency',
  ).length;

  const userCount = reports.filter(
    report => getReportTargetType(report) === 'user',
  ).length;

  const handleOpenReport = (report: Report) => {
    const reportId = getReportId(report);

    if (!reportId) {
      return;
    }

    navigation.navigate('AdminReportDetail', {
      reportId,
    });
  };

  const renderReport: ListRenderItem<Report> = ({item}) => {
    return (
      <AdminReportCard report={item} onPress={() => handleOpenReport(item)} />
    );
  };

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Reports Queue"
        subtitle={`${filteredReports.length} report${
          filteredReports.length === 1 ? '' : 's'
        } shown`}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh reports queue',
          disabled: reportsQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                reportsQuery.isRefetching ? colors.onDisabled : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: () => {
            void reportsQuery.refetch();
          },
        }}
      />

      <View style={styles.summaryWrap}>
        <Card variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <FileWarning color={colors.primary} size={24} />
          </View>

          <View style={styles.summaryContent}>
            <Text variant="labelLarge" color="onSurface">
              Admin Report Review
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              Review reports submitted against emergencies and users.
            </Text>
          </View>

          <StatusBadge
            label={`${pendingCount} pending`}
            tone={pendingCount > 0 ? 'warning' : 'success'}
            size="sm"
          />
        </Card>

        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <AlertTriangle color={colors.primary} size={22} />

            <Text variant="headingSmall" color="onSurface" style={styles.statValue}>
              {pendingCount}
            </Text>

            <Text variant="caption" color="onSurfaceVariant">
              Pending
            </Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <ShieldAlert color={colors.primary} size={22} />

            <Text variant="headingSmall" color="onSurface" style={styles.statValue}>
              {emergencyCount}
            </Text>

            <Text variant="caption" color="onSurfaceVariant">
              Emergency
            </Text>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <UserX color={colors.primary} size={22} />

            <Text variant="headingSmall" color="onSurface" style={styles.statValue}>
              {userCount}
            </Text>

            <Text variant="caption" color="onSurfaceVariant">
              User
            </Text>
          </Card>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            label="Search Reports"
            placeholder="Search by reason, description, or ID"
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search color={colors.onSurfaceVariant} size={20} />}
          />
        </View>

        <View style={styles.filterSection}>
          <Text variant="labelMedium" color="onSurface">
            Status
          </Text>

          <View style={styles.filterRow}>
            {statusFilters.map(filter => {
              const selected = statusFilter === filter.value;

              return (
                <PressableCard
                  key={filter.value}
                  variant={selected ? 'elevated' : 'outlined'}
                  onPress={() => setStatusFilter(filter.value)}
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

        <View style={styles.filterSection}>
          <Text variant="labelMedium" color="onSurface">
            Target
          </Text>

          <View style={styles.filterRow}>
            {targetFilters.map(filter => {
              const selected = targetFilter === filter.value;

              return (
                <PressableCard
                  key={filter.value}
                  variant={selected ? 'elevated' : 'outlined'}
                  onPress={() => setTargetFilter(filter.value)}
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
      </View>

      {reportsQuery.isLoading ? (
        <LoadingState
          title="Loading reports"
          message="Getting admin report queue..."
          fullScreen
        />
      ) : reportsQuery.isError ? (
        <ErrorState
          title="Unable to load reports"
          message="Admin reports queue could not be loaded right now."
          onRetry={() => {
            void reportsQuery.refetch();
          }}
          fullScreen
        />
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={item => getReportId(item)}
          renderItem={renderReport}
          contentContainerStyle={[
            styles.listContent,
            filteredReports.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={reportsQuery.isRefetching}
              onRefresh={() => {
                void reportsQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No reports found"
              message="No reports match the selected search or filters."
              icon={<FileWarning color={colors.onSurfaceVariant} size={34} />}
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
  filterSection: {
    marginTop: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  filterCard: {
    minWidth: 86,
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
  reportCard: {
    gap: spacing.md,
  },
  reportTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  reportMain: {
    flex: 1,
  },
  reportHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  reportTitle: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xs,
  },
  metaRows: {
    gap: spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  idRows: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  footer: {
    alignItems: 'center',
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
});