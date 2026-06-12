import React, {useMemo} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react-native';

import {
  NOTIFICATION_STATUSES,
  type NotificationStatus,
} from '../../config/constants';
import type {NotificationsScreenProps} from '../../navigation/navigation.types';
import {
  notificationsApi,
  type UserNotification,
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

type NotificationDetailScreenProps =
  NotificationsScreenProps<'NotificationDetail'>;

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

const formatStatusLabel = (status: NotificationStatus): string => {
  return status.replace('_', ' ').toUpperCase();
};

const getNotificationTone = (
  status: NotificationStatus,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  switch (status) {
    case NOTIFICATION_STATUSES.READ:
      return 'success';

    case NOTIFICATION_STATUSES.SENT:
      return 'info';

    case NOTIFICATION_STATUSES.FAILED:
      return 'danger';

    case NOTIFICATION_STATUSES.PENDING:
    default:
      return 'warning';
  }
};

const isUnreadNotification = (notification: UserNotification): boolean => {
  return (
    notification.status !== NOTIFICATION_STATUSES.READ &&
    notification.readAt === null
  );
};

export const NotificationDetailScreen = ({
  navigation,
  route,
}: NotificationDetailScreenProps) => {
  const {notificationId} = route.params;

  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.getMyNotifications,
  });

  const notification = useMemo(() => {
    return notificationsQuery.data?.find(item => item.id === notificationId);
  }, [notificationId, notificationsQuery.data]);

  const markReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAsRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['notifications', 'me'],
      });

      Alert.alert('Marked as read', 'This notification has been marked as read.');
    },
    onError: error => {
      Alert.alert(
        'Unable to update notification',
        getApiErrorMessage(
          error,
          'This notification could not be marked as read right now.',
        ),
      );
    },
  });

  const handleMarkAsRead = () => {
    if (!notification || !isUnreadNotification(notification)) {
      return;
    }

    markReadMutation.mutate();
  };

  const handleOpenEmergency = () => {
    if (!notification?.emergencyId) {
      return;
    }

    navigation.getParent()?.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'LiveSosStatus',
        params: {
          emergencyId: notification.emergencyId,
        },
      }),
    );
  };

  const handleRefresh = async () => {
    await notificationsQuery.refetch();
  };

  if (notificationsQuery.isLoading) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Notification"
          subtitle="Loading detail"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
        />

        <LoadingState
          title="Loading notification"
          message="Getting notification details..."
          fullScreen
        />
      </Screen>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Notification"
          subtitle="Unable to load"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
          rightAction={{
            accessibilityLabel: 'Retry notification detail',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void notificationsQuery.refetch();
            },
          }}
        />

        <ErrorState
          title="Unable to load notification"
          message="This notification could not be loaded right now."
          onRetry={() => {
            void notificationsQuery.refetch();
          }}
          fullScreen
        />
      </Screen>
    );
  }

  if (!notification) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Notification"
          subtitle="Not found"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
        />

        <ErrorState
          title="Notification not found"
          message="This notification is not available anymore."
          fullScreen
        />
      </Screen>
    );
  }

  const unread = isUnreadNotification(notification);

  return (
    <Screen
      safeArea
      scrollable
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Notification"
        subtitle={unread ? 'Unread update' : 'Read update'}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh notification',
          disabled: notificationsQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                notificationsQuery.isRefetching
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
        <Card variant={unread ? 'elevated' : 'outlined'} style={styles.heroCard}>
          <View style={[styles.heroIconWrap, unread && styles.unreadIconWrap]}>
            {unread ? (
              <BellRing color={colors.primary} size={36} />
            ) : (
              <Bell color={colors.onSurfaceVariant} size={36} />
            )}
          </View>

          <Text
            variant="headingSmall"
            color="onSurface"
            align="center"
            style={styles.heroTitle}>
            {notification.title}
          </Text>

          <View style={styles.heroBadges}>
            <StatusBadge
              label={formatStatusLabel(notification.status)}
              tone={getNotificationTone(notification.status)}
              dot={unread}
            />

            <StatusBadge
              label={notification.emergencyId ? 'Emergency' : 'General'}
              tone={notification.emergencyId ? 'danger' : 'neutral'}
            />
          </View>

          <Text
            variant="bodyMedium"
            color="onSurfaceVariant"
            align="center"
            style={styles.heroBody}>
            {notification.body}
          </Text>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clock color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Delivery Timeline
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Created
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(notification.createdAt)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Sent
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(notification.sentAt)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Read
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(notification.readAt)}
              </Text>
            </View>
          </View>
        </Card>

        {notification.emergencyId ? (
          <Card variant="outlined" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ShieldAlert color={colors.primary} size={22} />

              <Text variant="labelLarge" color="onSurface">
                Linked Emergency
              </Text>
            </View>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.linkedText}>
              This notification is connected to an emergency alert.
            </Text>

            <Button
              title="Open Emergency"
              fullWidth
              variant="danger"
              onPress={handleOpenEmergency}
              style={styles.sectionAction}
            />
          </Card>
        ) : null}

        <View style={styles.actions}>
          {unread ? (
            <Button
              title="Mark as Read"
              fullWidth
              size="lg"
              loading={markReadMutation.isPending}
              disabled={markReadMutation.isPending}
              leftIcon={<CheckCircle2 color={colors.onPrimary} size={20} />}
              onPress={handleMarkAsRead}
            />
          ) : (
            <Button
              title="Already Read"
              fullWidth
              size="lg"
              variant="outline"
              disabled
              leftIcon={<CheckCircle2 color={colors.onDisabled} size={20} />}
              onPress={() => undefined}
            />
          )}
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
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  unreadIconWrap: {
    backgroundColor: colors.primaryContainer,
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
  heroBody: {
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
  linkedText: {
    marginTop: spacing.md,
  },
  sectionAction: {
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
});