import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  History,
  MapPin,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react-native';

import {
  EMERGENCY_STATUSES,
  type EmergencyStatus,
} from '../../config/constants';
import type {ActivityScreenProps} from '../../navigation/navigation.types';
import {emergenciesApi, type Emergency} from '../../services/api';
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
} from '../../shared/components';
import {colors, radius, spacing} from '../../shared/theme';

type MyEmergencyHistoryScreenProps =
  ActivityScreenProps<'MyEmergencyHistory'>;

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
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatStatusLabel = (status: EmergencyStatus): string => {
  return status.replace('_', ' ').toUpperCase();
};

const getStatusTone = (
  status: EmergencyStatus,
): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case EMERGENCY_STATUSES.ACTIVE:
      return 'danger';

    case EMERGENCY_STATUSES.RESOLVED:
      return 'success';

    case EMERGENCY_STATUSES.CANCELLED:
      return 'warning';

    case EMERGENCY_STATUSES.EXPIRED:
    default:
      return 'neutral';
  }
};

const getPriorityTone = (
  priority: Emergency['priority'],
): 'neutral' | 'warning' | 'danger' => {
  if (priority === 'critical' || priority === 'high') {
    return 'danger';
  }

  if (priority === 'medium') {
    return 'warning';
  }

  return 'neutral';
};

const EmergencyHistoryCard = ({
  emergency,
  onPress,
}: {
  emergency: Emergency;
  onPress: () => void;
}) => {
  return (
    <PressableCard variant="outlined" onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <ShieldAlert color={colors.primary} size={26} />
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <Text
              variant="labelLarge"
              color="onSurface"
              numberOfLines={1}
              style={styles.cardTitle}>
              {emergency.title}
            </Text>

            <StatusBadge
              label={formatStatusLabel(emergency.status)}
              tone={getStatusTone(emergency.status)}
              size="sm"
              dot
            />
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            numberOfLines={2}
            style={styles.description}>
            {emergency.description || 'No extra description was provided.'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRows}>
        <View style={styles.metaRow}>
          <Clock color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Created {formatDateTime(emergency.createdAt)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <MapPin color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            {emergency.latitude.toFixed(5)}, {emergency.longitude.toFixed(5)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <StatusBadge
          label={emergency.priority.toUpperCase()}
          tone={getPriorityTone(emergency.priority)}
          size="sm"
        />

        <Text variant="caption" color="onSurfaceVariant">
          Radius {emergency.radiusKm} km
        </Text>
      </View>
    </PressableCard>
  );
};

export const MyEmergencyHistoryScreen = ({
  navigation,
}: MyEmergencyHistoryScreenProps) => {
  const emergencyHistoryQuery = useQuery({
    queryKey: ['emergencies', 'history'],
    queryFn: emergenciesApi.getMyHistory,
  });

  const emergencies = emergencyHistoryQuery.data ?? [];

  const activeCount = emergencies.filter(
    emergency => emergency.status === EMERGENCY_STATUSES.ACTIVE,
  ).length;

  const handleOpenEmergency = (emergency: Emergency) => {
    navigation.getParent()?.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'LiveSosStatus',
        params: {
          emergencyId: emergency.id,
        },
      }),
    );
  };

  const renderEmergency: ListRenderItem<Emergency> = ({item}) => {
    return (
      <EmergencyHistoryCard
        emergency={item}
        onPress={() => handleOpenEmergency(item)}
      />
    );
  };

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="My SOS History"
        subtitle={`${emergencies.length} emergency record${
          emergencies.length === 1 ? '' : 's'
        }`}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh emergency history',
          disabled: emergencyHistoryQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                emergencyHistoryQuery.isRefetching
                  ? colors.onDisabled
                  : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: () => {
            void emergencyHistoryQuery.refetch();
          },
        }}
      />

      <View style={styles.summaryWrap}>
        <Card variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <AlertTriangle color={colors.primary} size={24} />
          </View>

          <View style={styles.summaryContent}>
            <Text variant="labelLarge" color="onSurface">
              Your SOS Alerts
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              Review active, resolved, cancelled, and expired SOS alerts you
              created.
            </Text>
          </View>

          <StatusBadge
            label={`${activeCount} active`}
            tone={activeCount > 0 ? 'danger' : 'neutral'}
            size="sm"
          />
        </Card>
      </View>

      {emergencyHistoryQuery.isLoading ? (
        <LoadingState
          title="Loading SOS history"
          message="Getting emergencies you created..."
          fullScreen
        />
      ) : emergencyHistoryQuery.isError ? (
        <ErrorState
          title="Unable to load history"
          message="Your emergency history could not be loaded right now."
          onRetry={() => {
            void emergencyHistoryQuery.refetch();
          }}
          fullScreen
        />
      ) : (
        <FlatList
          data={emergencies}
          keyExtractor={item => item.id}
          renderItem={renderEmergency}
          contentContainerStyle={[
            styles.listContent,
            emergencies.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={emergencyHistoryQuery.isRefetching}
              onRefresh={() => {
                void emergencyHistoryQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No SOS history"
              message="You have not created any emergency alerts yet."
              icon={<History color={colors.onSurfaceVariant} size={34} />}
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
  footer: {
    alignItems: 'center',
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
});