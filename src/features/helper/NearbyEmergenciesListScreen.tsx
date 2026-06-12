import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  LocateFixed,
  Map,
  MapPin,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react-native';

import {APP_CONFIG, EMERGENCY_STATUSES} from '../../config/constants';
import type {HelperScreenProps} from '../../navigation/navigation.types';
import {locationsApi, type Emergency} from '../../services/api';
import {locationService} from '../../services/location/location.service';
import {
  Button,
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
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';
import {useAppStore} from '../../store';

type NearbyEmergenciesListScreenProps =
  HelperScreenProps<'NearbyEmergenciesList'>;

const DEFAULT_LOCATION = {
  latitude: 31.5204,
  longitude: 74.3587,
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

const formatDateTime = (value: string): string => {
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

const EmergencyListCard = ({
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
              label={emergency.priority}
              tone={getPriorityTone(emergency.priority)}
              size="sm"
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
          label={emergency.status.toUpperCase()}
          tone={emergency.status === EMERGENCY_STATUSES.ACTIVE ? 'danger' : 'neutral'}
          size="sm"
          dot
        />

        <Text variant="caption" color="onSurfaceVariant">
          Radius {emergency.radiusKm} km
        </Text>
      </View>
    </PressableCard>
  );
};

export const NearbyEmergenciesListScreen = ({
  navigation,
}: NearbyEmergenciesListScreenProps) => {
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const currentLocation = useAppStore(state => state.currentLocation);
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);

  const nearbyEmergenciesQuery = useQuery({
    queryKey: [
      'locations',
      'nearby-emergencies',
      currentLocation?.latitude,
      currentLocation?.longitude,
      APP_CONFIG.DEFAULT_ALERT_RADIUS_KM,
    ],
    queryFn: () =>
      locationsApi.getNearbyEmergencies({
        latitude: currentLocation?.latitude ?? DEFAULT_LOCATION.latitude,
        longitude: currentLocation?.longitude ?? DEFAULT_LOCATION.longitude,
        radiusKm: APP_CONFIG.DEFAULT_ALERT_RADIUS_KM,
      }),
    enabled: Boolean(currentLocation),
  });

  const activeEmergencies = useMemo(() => {
    return (nearbyEmergenciesQuery.data ?? []).filter(
      emergency => emergency.status === EMERGENCY_STATUSES.ACTIVE,
    );
  }, [nearbyEmergenciesQuery.data]);

  const updateCurrentLocation = useCallback(async () => {
    setIsUpdatingLocation(true);

    try {
      const location = await locationService.requestPermissionAndGetLocation();

      const savedLocation = await locationsApi.updateMe({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyMeters: location.accuracyMeters ?? undefined,
      });

      setCurrentLocation({
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        accuracyMeters: savedLocation.accuracyMeters,
        updatedAt: savedLocation.lastUpdatedAt,
      });
    } catch (error) {
      Alert.alert(
        'Location update failed',
        getApiErrorMessage(
          error,
          'Unable to update your current location right now.',
        ),
      );
    } finally {
      setIsUpdatingLocation(false);
    }
  }, [setCurrentLocation]);

  useFocusEffect(
    useCallback(() => {
      if (!currentLocation) {
        void updateCurrentLocation();
      } else {
        void nearbyEmergenciesQuery.refetch();
      }
    }, [currentLocation, nearbyEmergenciesQuery, updateCurrentLocation]),
  );

  const handleRefresh = async () => {
    await updateCurrentLocation();

    if (currentLocation) {
      await nearbyEmergenciesQuery.refetch();
    }
  };

  const handleOpenMap = () => {
    navigation.navigate('NearbyEmergenciesMap');
  };

  const handleOpenEmergency = (emergencyId: Emergency['id']) => {
    navigation.navigate('EmergencyDetailHelper', {
      emergencyId,
    });
  };

  const renderEmergency: ListRenderItem<Emergency> = ({item}) => (
    <EmergencyListCard
      emergency={item}
      onPress={() => handleOpenEmergency(item.id)}
    />
  );

  const isRefreshing =
    isUpdatingLocation || nearbyEmergenciesQuery.isRefetching;

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Emergency List"
        subtitle={`${activeEmergencies.length} active SOS alerts`}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh emergency list',
          disabled: isRefreshing,
          icon: (
            <RefreshCcw
              color={isRefreshing ? colors.onDisabled : colors.onSurface}
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      <View style={styles.summaryWrap}>
        <Card variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <AlertTriangle color={colors.primary} size={24} />
          </View>

          <View style={styles.summaryContent}>
            <Text variant="labelLarge" color="onSurface">
              Nearby Active SOS
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.summaryText}>
              Showing active emergency alerts within{' '}
              {APP_CONFIG.DEFAULT_ALERT_RADIUS_KM} km of your current location.
            </Text>
          </View>

          <StatusBadge
            label={String(activeEmergencies.length)}
            tone={activeEmergencies.length > 0 ? 'danger' : 'success'}
          />
        </Card>

        <Button
          title="Open Map View"
          variant="secondary"
          fullWidth
          leftIcon={<Map color={colors.onSecondary} size={20} />}
          onPress={handleOpenMap}
          style={styles.mapButton}
        />

        {currentLocation ? (
          <View style={styles.locationLine}>
            <LocateFixed color={colors.onSurfaceVariant} size={16} />

            <Text variant="caption" color="onSurfaceVariant">
              {currentLocation.latitude.toFixed(5)},{' '}
              {currentLocation.longitude.toFixed(5)}
            </Text>
          </View>
        ) : null}
      </View>

      {nearbyEmergenciesQuery.isLoading || isUpdatingLocation ? (
        <LoadingState
          title="Finding emergencies"
          message="Checking active SOS alerts near you..."
          fullScreen
        />
      ) : nearbyEmergenciesQuery.isError ? (
        <ErrorState
          title="Unable to load emergencies"
          message="Nearby emergencies could not be loaded right now."
          onRetry={() => {
            void nearbyEmergenciesQuery.refetch();
          }}
          fullScreen
        />
      ) : (
        <FlatList
          data={activeEmergencies}
          keyExtractor={item => item.id}
          renderItem={renderEmergency}
          contentContainerStyle={[
            styles.listContent,
            activeEmergencies.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                void handleRefresh();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No active emergencies nearby"
              message="There are no active SOS alerts in your selected radius right now."
              icon={<ShieldAlert color={colors.onSurfaceVariant} size={34} />}
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
  mapButton: {
    marginTop: spacing.md,
  },
  locationLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
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