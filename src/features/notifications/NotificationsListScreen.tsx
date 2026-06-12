import React, {useMemo} from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
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

type NotificationsListScreenProps =
  NotificationsScreenProps<'NotificationsList'>;

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

const NotificationCard = ({
  notification,
  onPress,
}: {
  notification: UserNotification;
  onPress: () => void;
}) => {
  const unread = isUnreadNotification(notification);

  return (
    <PressableCard
      variant={unread ? 'elevated' : 'outlined'}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, unread && styles.unreadIconWrap]}>
          {unread ? (
            <BellRing color={colors.primary} size={26} />
          ) : (
            <Bell color={colors.onSurfaceVariant} size={26} />
          )}
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <Text
              variant="labelLarge"
              color="onSurface"
              numberOfLines={1}
              style={styles.cardTitle}>
              {notification.title}
            </Text>

            <StatusBadge
              label={formatStatusLabel(notification.status)}
              tone={getNotificationTone(notification.status)}
              size="sm"
              dot={unread}
            />
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            numberOfLines={2}
            style={styles.bodyText}>
            {notification.body}
          </Text>
        </View>
      </View>

      <View style={styles.metaRows}>
        <View style={styles.metaRow}>
          <Clock color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Created {formatDateTime(notification.createdAt)}
          </Text>
        </View>

        {notification.sentAt ? (
          <View style={styles.metaRow}>
            <CheckCircle2 color={colors.onSurfaceVariant} size={16} />

            <Text variant="caption" color="onSurfaceVariant">
              Sent {formatDateTime(notification.sentAt)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text variant="caption" color="onSurfaceVariant">
          {notification.emergencyId
            ? 'Emergency notification'
            : 'General notification'}
        </Text>

        <Text variant="caption" color={unread ? 'primary' : 'onSurfaceVariant'}>
          {unread ? 'Unread' : 'Read'}
        </Text>
      </View>
    </PressableCard>
  );
};

export const NotificationsListScreen = ({
  navigation,
}: NotificationsListScreenProps) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.getMyNotifications,
  });

  const notifications = notificationsQuery.data ?? [];

  const unreadCount = useMemo(() => {
    return notifications.filter(isUnreadNotification).length;
  }, [notifications]);

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markAsRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['notifications', 'me'],
      });
    },
  });

  const handleOpenNotification = (notification: UserNotification) => {
    if (isUnreadNotification(notification)) {
      markReadMutation.mutate(notification.id);
    }

    navigation.navigate('NotificationDetail', {
      notificationId: notification.id,
    });
  };

  const renderNotification: ListRenderItem<UserNotification> = ({item}) => {
    return (
      <NotificationCard
        notification={item}
        onPress={() => handleOpenNotification(item)}
      />
    );
  };

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Notifications"
        subtitle={`${unreadCount} unread notification${
          unreadCount === 1 ? '' : 's'
        }`}
        borderBottom
        rightAction={{
          accessibilityLabel: 'Refresh notifications',
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
          onPress: () => {
            void notificationsQuery.refetch();
          },
        }}
      />

      <View style={styles.summaryWrap}>
        <Card variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <ShieldAlert color={colors.primary} size={24} />
          </View>

          <View style={styles.summaryContent}>
            <Text variant="labelLarge" color="onSurface">
              Emergency Updates
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              SOS alerts, responder updates, admin review updates, and system
              notifications appear here.
            </Text>
          </View>

          <StatusBadge
            label={`${unreadCount} unread`}
            tone={unreadCount > 0 ? 'danger' : 'success'}
            size="sm"
          />
        </Card>
      </View>

      {notificationsQuery.isLoading ? (
        <LoadingState
          title="Loading notifications"
          message="Getting your latest notifications..."
          fullScreen
        />
      ) : notificationsQuery.isError ? (
        <ErrorState
          title="Unable to load notifications"
          message="Your notifications could not be loaded right now."
          onRetry={() => {
            void notificationsQuery.refetch();
          }}
          fullScreen
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isRefetching}
              onRefresh={() => {
                void notificationsQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No notifications"
              message="You do not have any notifications yet."
              icon={<Bell color={colors.onSurfaceVariant} size={34} />}
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
  unreadIconWrap: {
    backgroundColor: colors.primaryContainer,
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
  bodyText: {
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