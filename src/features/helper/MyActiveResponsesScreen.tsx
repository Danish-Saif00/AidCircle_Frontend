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
  Clock,
  MapPin,
  RefreshCcw,
  ShieldAlert,
  UserCheck,
} from 'lucide-react-native';

import {RESPONDER_STATUSES, type ResponderStatus} from '../../config/constants';
import type {HelperScreenProps} from '../../navigation/navigation.types';
import {respondersApi, type EmergencyResponder} from '../../services/api';
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

type MyActiveResponsesScreenProps = HelperScreenProps<'MyActiveResponses'>;

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

const shortenId = (id: string): string => {
  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
};

const ActiveResponseCard = ({
  responder,
  onPress,
}: {
  responder: EmergencyResponder;
  onPress: () => void;
}) => {
  return (
    <PressableCard variant="outlined" onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <UserCheck color={colors.primary} size={26} />
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <Text
              variant="labelLarge"
              color="onSurface"
              numberOfLines={1}
              style={styles.cardTitle}>
              Active Emergency Response
            </Text>

            <StatusBadge
              label={formatStatusLabel(responder.status)}
              tone={getResponderTone(responder.status)}
              size="sm"
              dot
            />
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            numberOfLines={1}
            style={styles.description}>
            Emergency ID: {shortenId(responder.emergencyId)}
          </Text>
        </View>
      </View>

      <View style={styles.metaRows}>
        <View style={styles.metaRow}>
          <Clock color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Accepted {formatDateTime(responder.acceptedAt)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <RefreshCcw color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Updated {formatDateTime(responder.updatedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <MapPin color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Tap to manage response
          </Text>
        </View>
      </View>
    </PressableCard>
  );
};

export const MyActiveResponsesScreen = ({
  navigation,
}: MyActiveResponsesScreenProps) => {
  const activeResponsesQuery = useQuery({
    queryKey: ['responders', 'active'],
    queryFn: respondersApi.getMyActiveResponses,
  });

  const handleOpenResponse = (responder: EmergencyResponder) => {
    navigation.navigate('AcceptedEmergencyActive', {
      emergencyId: responder.emergencyId,
      responderId: responder.id,
      initialStatus: responder.status,
    });
  };

  const renderResponse: ListRenderItem<EmergencyResponder> = ({item}) => {
    return (
      <ActiveResponseCard
        responder={item}
        onPress={() => handleOpenResponse(item)}
      />
    );
  };

  const responses = activeResponsesQuery.data ?? [];

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Active Responses"
        subtitle={`${responses.length} active response${
          responses.length === 1 ? '' : 's'
        }`}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh active responses',
          disabled: activeResponsesQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                activeResponsesQuery.isRefetching
                  ? colors.onDisabled
                  : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: () => {
            void activeResponsesQuery.refetch();
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
              Your Active Help
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              These are emergencies you accepted and are currently managing.
            </Text>
          </View>

          <StatusBadge
            label={String(responses.length)}
            tone={responses.length > 0 ? 'info' : 'neutral'}
          />
        </Card>
      </View>

      {activeResponsesQuery.isLoading ? (
        <LoadingState
          title="Loading active responses"
          message="Getting emergencies you are responding to..."
          fullScreen
        />
      ) : activeResponsesQuery.isError ? (
        <ErrorState
          title="Unable to load responses"
          message="Your active responses could not be loaded right now."
          onRetry={() => {
            void activeResponsesQuery.refetch();
          }}
          fullScreen
        />
      ) : (
        <FlatList
          data={responses}
          keyExtractor={item => item.id}
          renderItem={renderResponse}
          contentContainerStyle={[
            styles.listContent,
            responses.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={activeResponsesQuery.isRefetching}
              onRefresh={() => {
                void activeResponsesQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No active responses"
              message="You have not accepted any active emergency yet."
              icon={<UserCheck color={colors.onSurfaceVariant} size={34} />}
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
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  footerItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
});