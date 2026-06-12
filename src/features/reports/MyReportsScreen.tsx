import React from 'react';
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
  Clock,
  FileText,
  FileWarning,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react-native';

import type {ProfileScreenProps} from '../../navigation/navigation.types';
import {reportsApi, type Report} from '../../services/api';
import {
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  StatusBadge,
  Text,
} from '../../shared/components';
import {colors, radius, spacing} from '../../shared/theme';

type MyReportsScreenProps = ProfileScreenProps<'MyReports'>;

type ReportStatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

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
  return getStringValue(report as ReportRecord, 'id', String(Math.random()));
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

const getReportAdminNotes = (report: Report): string | null => {
  return getNullableStringValue(report as ReportRecord, 'adminNotes');
};

const getReportTargetType = (report: Report): string => {
  const record = report as ReportRecord;

  const explicitTargetType = getNullableStringValue(record, 'targetType');

  if (explicitTargetType) {
    return explicitTargetType;
  }

  if (getNullableStringValue(record, 'emergencyId')) {
    return 'emergency';
  }

  if (
    getNullableStringValue(record, 'reportedUserId') ||
    getNullableStringValue(record, 'userId') ||
    getNullableStringValue(record, 'targetUserId')
  ) {
    return 'user';
  }

  return 'report';
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

const getStatusTone = (status: string): ReportStatusTone => {
  switch (status) {
    case 'reviewed':
      return 'info';

    case 'dismissed':
      return 'neutral';

    case 'action_taken':
      return 'success';

    case 'pending':
    default:
      return 'warning';
  }
};

const getTargetTone = (targetType: string): ReportStatusTone => {
  if (targetType === 'emergency') {
    return 'danger';
  }

  if (targetType === 'user') {
    return 'warning';
  }

  return 'neutral';
};

const ReportCard = ({report}: {report: Report}) => {
  const status = getReportStatus(report);
  const targetType = getReportTargetType(report);
  const description = getReportDescription(report);
  const adminNotes = getReportAdminNotes(report);
  const reviewedAt = getReportReviewedAt(report);

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          {targetType === 'emergency' ? (
            <ShieldAlert color={colors.primary} size={26} />
          ) : (
            <FileWarning color={colors.primary} size={26} />
          )}
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <Text
              variant="labelLarge"
              color="onSurface"
              numberOfLines={1}
              style={styles.cardTitle}>
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

      {adminNotes ? (
        <View style={styles.adminNotesBox}>
          <Text variant="labelMedium" color="onSurface">
            Admin Notes
          </Text>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.adminNotesText}>
            {adminNotes}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <StatusBadge
          label={targetType.toUpperCase()}
          tone={getTargetTone(targetType)}
          size="sm"
        />

        <Text variant="caption" color="onSurfaceVariant">
          ID: {getReportId(report).slice(0, 8)}
        </Text>
      </View>
    </Card>
  );
};

export const MyReportsScreen = ({navigation}: MyReportsScreenProps) => {
  const reportsQuery = useQuery({
    queryKey: ['reports', 'me'],
    queryFn: reportsApi.getMyReports,
  });

  const reports = reportsQuery.data ?? [];

  const pendingCount = reports.filter(
    report => getReportStatus(report) === 'pending',
  ).length;

  const renderReport: ListRenderItem<Report> = ({item}) => {
    return <ReportCard report={item} />;
  };

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="My Reports"
        subtitle={`${reports.length} submitted report${
          reports.length === 1 ? '' : 's'
        }`}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh my reports',
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
            <FileText color={colors.primary} size={24} />
          </View>

          <View style={styles.summaryContent}>
            <Text variant="labelLarge" color="onSurface">
              Submitted Reports
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              Reports submitted by you are reviewed by admins.
            </Text>
          </View>

          <StatusBadge
            label={`${pendingCount} pending`}
            tone={pendingCount > 0 ? 'warning' : 'success'}
            size="sm"
          />
        </Card>
      </View>

      {reportsQuery.isLoading ? (
        <LoadingState
          title="Loading reports"
          message="Getting reports you submitted..."
          fullScreen
        />
      ) : reportsQuery.isError ? (
        <ErrorState
          title="Unable to load reports"
          message="Your submitted reports could not be loaded right now."
          onRetry={() => {
            void reportsQuery.refetch();
          }}
          fullScreen
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => getReportId(item)}
          renderItem={renderReport}
          contentContainerStyle={[
            styles.listContent,
            reports.length === 0 && styles.emptyListContent,
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
              title="No reports submitted"
              message="You have not submitted any reports yet."
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
  card: {
    gap: spacing.md,
  },
  cardTop: {
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
  cardMain: {
    flex: 1,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardTitle: {
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
  adminNotesBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  adminNotesText: {
    marginTop: spacing.xs,
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