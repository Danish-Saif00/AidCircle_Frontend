import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Route,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react-native';

import {
  APP_CONFIG,
  EMERGENCY_STATUSES,
  RESPONDER_STATUSES,
  type ResponderStatus,
} from '../../config/constants';
import type {HelperScreenProps} from '../../navigation/navigation.types';
import {
  emergenciesApi,
  respondersApi,
  type Emergency,
  type EmergencyResponder,
} from '../../services/api';
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

type AcceptedEmergencyActiveScreenProps =
  HelperScreenProps<'AcceptedEmergencyActive'>;

type ResponderAction = 'on_way' | 'arrived' | 'cancelled' | 'leave' | null;

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

const formatStatusLabel = (status: string): string => {
  return status.replace('_', ' ').toUpperCase();
};

const getResponderTone = (
  status: ResponderStatus,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  switch (status) {
    case RESPONDER_STATUSES.ACCEPTED:
      return 'info';

    case RESPONDER_STATUSES.ON_WAY:
      return 'warning';

    case RESPONDER_STATUSES.ARRIVED:
      return 'success';

    case RESPONDER_STATUSES.CANCELLED:
      return 'danger';

    default:
      return 'neutral';
  }
};

const getEmergencyTone = (
  status: Emergency['status'],
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

const isEmergencyClosed = (status: Emergency['status']): boolean => {
  return (
    status === EMERGENCY_STATUSES.RESOLVED ||
    status === EMERGENCY_STATUSES.CANCELLED ||
    status === EMERGENCY_STATUSES.EXPIRED
  );
};

export const AcceptedEmergencyActiveScreen = ({
  navigation,
  route,
}: AcceptedEmergencyActiveScreenProps) => {
  const {emergencyId, initialStatus} = route.params;

  const queryClient = useQueryClient();

  const [dialogAction, setDialogAction] = useState<ResponderAction>(null);

  const emergencyQuery = useQuery({
    queryKey: ['emergencies', 'detail', emergencyId],
    queryFn: () => emergenciesApi.getById(emergencyId),
    refetchInterval: APP_CONFIG.LIVE_STATUS_POLL_INTERVAL_MS,
  });

  const activeResponsesQuery = useQuery({
    queryKey: ['responders', 'active'],
    queryFn: respondersApi.getMyActiveResponses,
    refetchInterval: APP_CONFIG.LIVE_STATUS_POLL_INTERVAL_MS,
  });

  const activeResponder = useMemo<EmergencyResponder | undefined>(() => {
    return activeResponsesQuery.data?.find(
      responder => responder.emergencyId === emergencyId,
    );
  }, [activeResponsesQuery.data, emergencyId]);

  const currentResponderStatus =
    activeResponder?.status ?? initialStatus ?? RESPONDER_STATUSES.ACCEPTED;

  const updateStatusMutation = useMutation({
    mutationFn: (status: Extract<ResponderStatus, 'on_way' | 'arrived' | 'cancelled'>) =>
      respondersApi.updateStatus(emergencyId, {
        status,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['responders', 'active'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['responders', 'history'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['emergencies', 'detail', emergencyId],
        }),
      ]);

      await Promise.all([
        activeResponsesQuery.refetch(),
        emergencyQuery.refetch(),
      ]);

      setDialogAction(null);
    },
    onError: error => {
      Alert.alert(
        'Status update failed',
        getApiErrorMessage(
          error,
          'Unable to update your responder status right now.',
        ),
      );
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => respondersApi.leaveEmergency(emergencyId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['responders', 'active'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['responders', 'history'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['locations', 'nearby-emergencies'],
        }),
      ]);

      setDialogAction(null);

      navigation.navigate('NearbyEmergenciesList');
    },
    onError: error => {
      Alert.alert(
        'Unable to leave response',
        getApiErrorMessage(
          error,
          'You could not leave this emergency response right now.',
        ),
      );
    },
  });

  const isActionLoading =
    updateStatusMutation.isPending || leaveMutation.isPending;

  const dialogConfig = useMemo(() => {
    switch (dialogAction) {
      case 'on_way':
        return {
          title: 'Mark as on the way?',
          message: 'This will update your responder status to on the way.',
          confirmLabel: 'Mark On Way',
          tone: 'primary' as const,
        };

      case 'arrived':
        return {
          title: 'Mark as arrived?',
          message: 'This will update your responder status to arrived.',
          confirmLabel: 'Mark Arrived',
          tone: 'primary' as const,
        };

      case 'cancelled':
        return {
          title: 'Cancel your response?',
          message:
            'This will mark your response as cancelled. Use this if you can no longer help.',
          confirmLabel: 'Cancel Response',
          tone: 'danger' as const,
        };

      case 'leave':
        return {
          title: 'Leave this emergency?',
          message:
            'This will remove this emergency from your active responses.',
          confirmLabel: 'Leave',
          tone: 'danger' as const,
        };

      default:
        return {
          title: '',
          message: '',
          confirmLabel: 'Confirm',
          tone: 'primary' as const,
        };
    }
  }, [dialogAction]);

  const handleConfirmAction = async () => {
    if (!dialogAction) {
      return;
    }

    if (dialogAction === 'leave') {
      leaveMutation.mutate();
      return;
    }

    updateStatusMutation.mutate(dialogAction);
  };

  const handleRefresh = async () => {
    await Promise.all([
      emergencyQuery.refetch(),
      activeResponsesQuery.refetch(),
    ]);
  };

  const emergency = emergencyQuery.data;
  const closed = emergency ? isEmergencyClosed(emergency.status) : false;
  const responseCancelled =
    currentResponderStatus === RESPONDER_STATUSES.CANCELLED;

  const actionsDisabled = closed || responseCancelled || isActionLoading;

  return (
    <Screen
      safeArea
      scrollable
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Active Response"
        subtitle="Responder status"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh response',
          disabled:
            emergencyQuery.isRefetching || activeResponsesQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                emergencyQuery.isRefetching || activeResponsesQuery.isRefetching
                  ? colors.onDisabled
                  : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      {emergencyQuery.isLoading || activeResponsesQuery.isLoading ? (
        <LoadingState
          title="Loading response"
          message="Getting latest emergency and responder status..."
          fullScreen
        />
      ) : emergencyQuery.isError || !emergency ? (
        <ErrorState
          title="Unable to load response"
          message="This active emergency response could not be loaded."
          onRetry={() => {
            void handleRefresh();
          }}
          fullScreen
        />
      ) : (
        <View style={styles.content}>
          <Card
            variant={closed || responseCancelled ? 'outlined' : 'danger'}
            style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <UserCheck
                color={
                  closed || responseCancelled
                    ? colors.primary
                    : colors.onErrorContainer
                }
                size={36}
              />
            </View>

            <Text
              variant="headingSmall"
              color={
                closed || responseCancelled ? 'onSurface' : 'onErrorContainer'
              }
              align="center"
              style={styles.heroTitle}>
              {closed
                ? 'Emergency Closed'
                : responseCancelled
                  ? 'Response Cancelled'
                  : 'You Are Responding'}
            </Text>

            <View style={styles.heroBadges}>
              <StatusBadge
                label={formatStatusLabel(currentResponderStatus)}
                tone={getResponderTone(currentResponderStatus)}
                dot
              />

              <StatusBadge
                label={formatStatusLabel(emergency.status)}
                tone={getEmergencyTone(emergency.status)}
              />
            </View>

            <Text
              variant="bodySmall"
              color={
                closed || responseCancelled
                  ? 'onSurfaceVariant'
                  : 'onErrorContainer'
              }
              align="center"
              style={styles.heroText}>
              {closed
                ? 'This emergency is no longer active.'
                : responseCancelled
                  ? 'You are no longer actively responding to this SOS.'
                  : 'Keep your status updated so the requester and system know your progress.'}
            </Text>
          </Card>

          <Card variant="outlined" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ShieldAlert color={colors.primary} size={22} />

              <Text variant="labelLarge" color="onSurface">
                Emergency
              </Text>
            </View>

            <View style={styles.detailList}>
              <View style={styles.detailColumn}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Title
                </Text>

                <Text
                  variant="labelLarge"
                  color="onSurface"
                  style={styles.detailText}>
                  {emergency.title}
                </Text>
              </View>

              {emergency.description ? (
                <View style={styles.detailColumn}>
                  <Text variant="bodySmall" color="onSurfaceVariant">
                    Description
                  </Text>

                  <Text
                    variant="bodyMedium"
                    color="onSurface"
                    style={styles.detailText}>
                    {emergency.description}
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Priority
                </Text>

                <StatusBadge
                  label={emergency.priority.toUpperCase()}
                  tone={
                    emergency.priority === 'critical' ||
                    emergency.priority === 'high'
                      ? 'danger'
                      : emergency.priority === 'medium'
                        ? 'warning'
                        : 'neutral'
                  }
                  size="sm"
                />
              </View>
            </View>
          </Card>

          <Card variant="outlined" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LocateFixed color={colors.primary} size={22} />

              <Text variant="labelLarge" color="onSurface">
                Emergency Location
              </Text>
            </View>

            <View style={styles.locationBox}>
              <View style={styles.locationIconWrap}>
                <MapPin color={colors.onPrimary} size={24} />
              </View>

              <View style={styles.locationInfo}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Coordinates
                </Text>

                <Text
                  variant="labelLarge"
                  color="onSurface"
                  style={styles.detailText}>
                  {emergency.latitude.toFixed(6)},{' '}
                  {emergency.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </Card>

          <Card variant="outlined" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Clock color={colors.primary} size={22} />

              <Text variant="labelLarge" color="onSurface">
                Response Timeline
              </Text>
            </View>

            <View style={styles.detailList}>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Accepted
                </Text>

                <Text variant="labelMedium" color="onSurface" align="right">
                  {formatDateTime(activeResponder?.acceptedAt)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Last Updated
                </Text>

                <Text variant="labelMedium" color="onSurface" align="right">
                  {formatDateTime(activeResponder?.updatedAt)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Emergency Expires
                </Text>

                <Text variant="labelMedium" color="onSurface" align="right">
                  {formatDateTime(emergency.expiresAt)}
                </Text>
              </View>
            </View>
          </Card>

          <Card variant="outlined" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Route color={colors.primary} size={22} />

              <Text variant="labelLarge" color="onSurface">
                Update Your Status
              </Text>
            </View>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.statusHint}>
              Use these actions as your response progresses.
            </Text>

            <View style={styles.statusActions}>
              <Button
                title="On Way"
                fullWidth
                variant="secondary"
                disabled={
                  actionsDisabled ||
                  currentResponderStatus === RESPONDER_STATUSES.ON_WAY
                }
                onPress={() => setDialogAction('on_way')}
              />

              <Button
                title="Arrived"
                fullWidth
                variant="success"
                disabled={
                  actionsDisabled ||
                  currentResponderStatus === RESPONDER_STATUSES.ARRIVED
                }
                leftIcon={<CheckCircle2 color={colors.onSuccess} size={20} />}
                onPress={() => setDialogAction('arrived')}
                style={styles.actionGap}
              />

              <Button
                title="Cancel Response"
                fullWidth
                variant="danger"
                disabled={actionsDisabled}
                leftIcon={<XCircle color={colors.onDanger} size={20} />}
                onPress={() => setDialogAction('cancelled')}
                style={styles.actionGap}
              />

              <Button
                title="Leave Emergency"
                fullWidth
                variant="outline"
                disabled={isActionLoading}
                onPress={() => setDialogAction('leave')}
                style={styles.actionGap}
              />
            </View>
          </Card>
        </View>
      )}

      <ConfirmDialog
        visible={dialogAction !== null}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel="Cancel"
        tone={dialogConfig.tone}
        loading={isActionLoading}
        onConfirm={handleConfirmAction}
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
  locationInfo: {
    flex: 1,
  },
  statusHint: {
    marginTop: spacing.sm,
  },
  statusActions: {
    marginTop: spacing.md,
  },
  actionGap: {
    marginTop: spacing.md,
  },
});