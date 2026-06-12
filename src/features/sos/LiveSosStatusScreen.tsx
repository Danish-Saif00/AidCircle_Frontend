import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flag,
  LocateFixed,
  RefreshCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react-native';

import {
  APP_CONFIG,
  EMERGENCY_STATUSES,
  type EmergencyStatus,
} from '../../config/constants';
import type {AppScreenProps} from '../../navigation/navigation.types';
import {emergenciesApi, type Emergency} from '../../services/api';
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  StatusBadge,
  Text,
} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';

type LiveSosStatusScreenProps = AppScreenProps<'LiveSosStatus'>;

type DialogAction = 'cancel' | 'resolve' | null;

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

const formatStatusLabel = (status: EmergencyStatus): string => {
  return status.replace('_', ' ').toUpperCase();
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const isFinalEmergencyStatus = (status: EmergencyStatus): boolean => {
  return (
    status === EMERGENCY_STATUSES.RESOLVED ||
    status === EMERGENCY_STATUSES.CANCELLED ||
    status === EMERGENCY_STATUSES.EXPIRED
  );
};

export const LiveSosStatusScreen = ({
  navigation,
  route,
}: LiveSosStatusScreenProps) => {
  const {emergencyId} = route.params;

  const queryClient = useQueryClient();

  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const emergencyQuery = useQuery({
    queryKey: ['emergencies', 'detail', emergencyId],
    queryFn: () => emergenciesApi.getById(emergencyId),
    refetchInterval: APP_CONFIG.LIVE_STATUS_POLL_INTERVAL_MS,
  });

  const emergency = emergencyQuery.data;

  const isFinalStatus = emergency
    ? isFinalEmergencyStatus(emergency.status)
    : false;

  const statusTone = emergency ? getStatusTone(emergency.status) : 'neutral';

  const dialogConfig = useMemo(() => {
    if (dialogAction === 'cancel') {
      return {
        title: 'Cancel SOS alert?',
        message:
          'Nearby helpers will no longer see this emergency as active. Use this only if help is no longer needed.',
        confirmLabel: 'Cancel SOS',
        tone: 'danger' as const,
      };
    }

    if (dialogAction === 'resolve') {
      return {
        title: 'Mark SOS as resolved?',
        message:
          'This will close the emergency and mark it as successfully resolved.',
        confirmLabel: 'Resolve SOS',
        tone: 'primary' as const,
      };
    }

    return {
      title: '',
      message: '',
      confirmLabel: 'Confirm',
      tone: 'primary' as const,
    };
  }, [dialogAction]);

  const invalidateEmergencyQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['emergencies', 'detail', emergencyId],
      }),
      queryClient.invalidateQueries({
        queryKey: ['emergencies', 'history'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['emergencies'],
      }),
    ]);
  };

  const handleDialogConfirm = async () => {
    if (!dialogAction) {
      return;
    }

    setIsActionLoading(true);

    try {
      if (dialogAction === 'cancel') {
        await emergenciesApi.cancel(emergencyId);
        Alert.alert('SOS cancelled', 'Your SOS alert has been cancelled.');
      }

      if (dialogAction === 'resolve') {
        await emergenciesApi.resolve(emergencyId);
        Alert.alert('SOS resolved', 'Your SOS alert has been marked resolved.');
      }

      setDialogAction(null);
      await invalidateEmergencyQueries();
      await emergencyQuery.refetch();
    } catch (error) {
      Alert.alert(
        'Action failed',
        getApiErrorMessage(error, 'Unable to update this SOS alert.'),
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    await emergencyQuery.refetch();
  };

  const handleBackToHome = () => {
    navigation.navigate('MainTabs', {
      screen: 'HomeTab',
      params: {
        screen: 'HomeMapSos',
      },
    });
  };

  const renderEmergencyContent = (item: Emergency) => {
    return (
      <View style={styles.content}>
        <Card
          variant={item.status === EMERGENCY_STATUSES.ACTIVE ? 'danger' : 'outlined'}
          style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <ShieldAlert
              color={
                item.status === EMERGENCY_STATUSES.ACTIVE
                  ? colors.onErrorContainer
                  : colors.primary
              }
              size={34}
            />
          </View>

          <Text
            variant="headingSmall"
            color={
              item.status === EMERGENCY_STATUSES.ACTIVE
                ? 'onErrorContainer'
                : 'onSurface'
            }
            align="center"
            style={styles.statusTitle}>
            {item.status === EMERGENCY_STATUSES.ACTIVE
              ? 'SOS Alert Active'
              : 'SOS Alert Closed'}
          </Text>

          <StatusBadge
            label={formatStatusLabel(item.status)}
            tone={statusTone}
            dot
            style={styles.statusBadge}
          />

          <Text
            variant="bodySmall"
            color={
              item.status === EMERGENCY_STATUSES.ACTIVE
                ? 'onErrorContainer'
                : 'onSurfaceVariant'
            }
            align="center"
            style={styles.statusText}>
            {item.status === EMERGENCY_STATUSES.ACTIVE
              ? 'Nearby helpers can see this emergency. Keep your phone nearby and refresh for updates.'
              : 'This emergency is no longer active.'}
          </Text>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Flag color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Emergency Details
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailColumn}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Title
              </Text>

              <Text variant="labelLarge" color="onSurface" style={styles.detailText}>
                {item.title}
              </Text>
            </View>

            {item.description ? (
              <View style={styles.detailColumn}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Description
                </Text>

                <Text
                  variant="bodyMedium"
                  color="onSurface"
                  style={styles.detailText}>
                  {item.description}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Priority
              </Text>

              <StatusBadge
                label={item.priority.toUpperCase()}
                tone={
                  item.priority === 'critical' || item.priority === 'high'
                    ? 'danger'
                    : item.priority === 'medium'
                      ? 'warning'
                      : 'neutral'
                }
                size="sm"
              />
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Radius
              </Text>

              <Text variant="labelMedium" color="onSurface">
                {item.radiusKm} km
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <LocateFixed color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Location
            </Text>
          </View>

          <View style={styles.locationBox}>
            <View style={styles.locationIconWrap}>
              <LocateFixed color={colors.onPrimary} size={24} />
            </View>

            <View style={styles.locationTextWrap}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Coordinates shared with SOS
              </Text>

              <Text variant="labelLarge" color="onSurface" style={styles.detailText}>
                {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clock color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Timeline
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Created
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(item.createdAt)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Expires
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(item.expiresAt)}
              </Text>
            </View>

            {item.resolvedAt ? (
              <View style={styles.detailRow}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Resolved
                </Text>

                <Text variant="labelMedium" color="onSurface" align="right">
                  {formatDateTime(item.resolvedAt)}
                </Text>
              </View>
            ) : null}

            {item.cancelledAt ? (
              <View style={styles.detailRow}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Cancelled
                </Text>

                <Text variant="labelMedium" color="onSurface" align="right">
                  {formatDateTime(item.cancelledAt)}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {isFinalStatus ? (
          <Button
            title="Back to Home"
            fullWidth
            size="lg"
            onPress={handleBackToHome}
            style={styles.primaryAction}
          />
        ) : (
          <View style={styles.actions}>
            <Button
              title="Resolve SOS"
              fullWidth
              size="lg"
              variant="success"
              leftIcon={<CheckCircle2 color={colors.onSuccess} size={20} />}
              disabled={isActionLoading}
              onPress={() => setDialogAction('resolve')}
            />

            <Button
              title="Cancel SOS"
              fullWidth
              size="lg"
              variant="danger"
              leftIcon={<XCircle color={colors.onDanger} size={20} />}
              disabled={isActionLoading}
              onPress={() => setDialogAction('cancel')}
              style={styles.cancelButton}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen
      safeArea
      scrollable
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Live SOS Status"
        subtitle="Auto-refresh enabled"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh SOS status',
          disabled: emergencyQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                emergencyQuery.isRefetching ? colors.onDisabled : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      {emergencyQuery.isLoading ? (
        <LoadingState
          title="Loading SOS"
          message="Getting latest emergency status..."
          fullScreen
        />
      ) : emergencyQuery.isError ? (
        <ErrorState
          title="Unable to load SOS"
          message="This emergency could not be loaded right now."
          onRetry={() => {
            void emergencyQuery.refetch();
          }}
          fullScreen
        />
      ) : emergency ? (
        renderEmergencyContent(emergency)
      ) : (
        <ErrorState
          title="SOS not found"
          message="This emergency is not available."
          fullScreen
        />
      )}

      <ConfirmDialog
        visible={dialogAction !== null}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel="Keep Open"
        tone={dialogConfig.tone}
        loading={isActionLoading}
        onConfirm={handleDialogConfirm}
        onCancel={() => {
          if (!isActionLoading) {
            setDialogAction(null);
          }
        }}
      />
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
  statusCard: {
    alignItems: 'center',
  },
  statusIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  statusTitle: {
    marginTop: spacing.md,
  },
  statusBadge: {
    marginTop: spacing.md,
  },
  statusText: {
    marginTop: spacing.sm,
    maxWidth: 310,
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
  locationBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  locationIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  locationTextWrap: {
    flex: 1,
  },
  actions: {
    marginTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  primaryAction: {
    marginTop: spacing.xxxl,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
});