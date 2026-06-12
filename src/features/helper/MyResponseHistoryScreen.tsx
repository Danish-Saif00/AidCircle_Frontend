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
  History,
  MapPin,
  RefreshCcw,
  ShieldAlert,
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

type MyResponseHistoryScreenProps = HelperScreenProps<'MyResponseHistory'>;

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

const ResponseHistoryCard = ({
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
          <History color={colors.primary} size={26} />
        </View>

        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <Text
              variant="labelLarge"
              color="onSurface"
              numberOfLines={1}
              style={styles.cardTitle}>
              Emergency Response
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
            Last updated {formatDateTime(responder.updatedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <MapPin color={colors.onSurfaceVariant} size={16} />

          <Text variant="caption" color="onSurfaceVariant">
            Tap to view emergency detail
          </Text>
        </View>
      </View>
    </PressableCard>
  );
};

export const MyResponseHistoryScreen = ({
  navigation,
}: MyResponseHistoryScreenProps) => {
  const responseHistoryQuery = useQuery({
    queryKey: ['responders', 'history'],
    queryFn: respondersApi.getMyResponseHistory,
  });

  const responses = responseHistoryQuery.data ?? [];

  const handleOpenResponse = (responder: EmergencyResponder) => {
    navigation.navigate('EmergencyDetailHelper', {
      emergencyId: responder.emergencyId,
    });
  };

  const renderResponse: ListRenderItem<EmergencyResponder> = ({item}) => {
    return (
      <ResponseHistoryCard
        responder={item}
        onPress={() => handleOpenResponse(item)}
      />
    );
  };

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Response History"
        subtitle={`${responses.length} response record${
          responses.length === 1 ? '' : 's'
        }`}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh response history',
          disabled: responseHistoryQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                responseHistoryQuery.isRefetching
                  ? colors.onDisabled
                  : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: () => {
            void responseHistoryQuery.refetch();
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
              Help History
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              These are emergency responses you accepted in the past.
            </Text>
          </View>

          <StatusBadge
            label={String(responses.length)}
            tone={responses.length > 0 ? 'info' : 'neutral'}
          />
        </Card>
      </View>

      {responseHistoryQuery.isLoading ? (
        <LoadingState
          title="Loading response history"
          message="Getting your previous emergency responses..."
          fullScreen
        />
      ) : responseHistoryQuery.isError ? (
        <ErrorState
          title="Unable to load history"
          message="Your response history could not be loaded right now."
          onRetry={() => {
            void responseHistoryQuery.refetch();
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
              refreshing={responseHistoryQuery.isRefetching}
              onRefresh={() => {
                void responseHistoryQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No response history"
              message="You have not responded to any emergency yet."
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