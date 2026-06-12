import React, {useCallback, useMemo, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import MapView, {Marker, type Region} from 'react-native-maps';
import {
  AlertTriangle,
  List,
  LocateFixed,
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
import {colors, radius, shadows, spacing} from '../../shared/theme';
import {useAppStore} from '../../store';

type NearbyEmergenciesMapScreenProps =
  HelperScreenProps<'NearbyEmergenciesMap'>;

const DEFAULT_REGION: Region = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const createRegion = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
});

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

const formatStatus = (status: Emergency['status']): string => {
  return status.replace('_', ' ').toUpperCase();
};

const formatCreatedAt = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const NearbyEmergenciesMapScreen = ({
  navigation,
}: NearbyEmergenciesMapScreenProps) => {
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const currentLocation = useAppStore(state => state.currentLocation);
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);

  const region = useMemo<Region>(() => {
    if (!currentLocation) {
      return DEFAULT_REGION;
    }

    return createRegion(currentLocation.latitude, currentLocation.longitude);
  }, [currentLocation]);

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
        latitude: currentLocation?.latitude ?? DEFAULT_REGION.latitude,
        longitude: currentLocation?.longitude ?? DEFAULT_REGION.longitude,
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

  const handleOpenEmergency = (emergencyId: Emergency['id']) => {
    navigation.navigate('EmergencyDetailHelper', {
      emergencyId,
    });
  };

  const latestEmergencies = activeEmergencies.slice(0, 3);

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Nearby Emergencies"
        subtitle="Active SOS alerts around you"
        borderBottom
        rightAction={{
          accessibilityLabel: 'Refresh nearby emergencies',
          disabled: isUpdatingLocation || nearbyEmergenciesQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                isUpdatingLocation || nearbyEmergenciesQuery.isRefetching
                  ? colors.onDisabled
                  : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}>
          {currentLocation ? (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your location">
              <View style={styles.currentLocationMarker}>
                <LocateFixed color={colors.white} size={20} />
              </View>
            </Marker>
          ) : null}

          {activeEmergencies.map(emergency => (
            <Marker
              key={emergency.id}
              coordinate={{
                latitude: emergency.latitude,
                longitude: emergency.longitude,
              }}
              title={emergency.title}
              description={`${emergency.priority.toUpperCase()} priority`}
              onPress={() => handleOpenEmergency(emergency.id)}>
              <View
                style={[
                  styles.emergencyMarker,
                  emergency.priority === 'critical' && styles.criticalMarker,
                ]}>
                <AlertTriangle color={colors.white} size={20} />
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={styles.mapTopOverlay}>
          <StatusBadge
            label={`${activeEmergencies.length} active nearby`}
            tone={activeEmergencies.length > 0 ? 'danger' : 'success'}
            dot
          />
        </View>

        <View style={styles.mapBottomOverlay}>
          <Button
            title="List View"
            size="sm"
            variant="secondary"
            leftIcon={<List color={colors.onSecondary} size={18} />}
            onPress={() => navigation.navigate('NearbyEmergenciesList')}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Card variant="outlined" style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationTitleWrap}>
              <MapPin color={colors.primary} size={22} />

              <Text variant="labelLarge" color="onSurface">
                Search Area
              </Text>
            </View>

            <StatusBadge
              label={`${APP_CONFIG.DEFAULT_ALERT_RADIUS_KM} km`}
              tone="info"
              size="sm"
            />
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.locationText}>
            {currentLocation
              ? `Using your latest location: ${currentLocation.latitude.toFixed(
                  5,
                )}, ${currentLocation.longitude.toFixed(5)}`
              : 'Location is needed to find nearby emergencies.'}
          </Text>
        </Card>

        {nearbyEmergenciesQuery.isLoading || isUpdatingLocation ? (
          <LoadingState
            title="Finding emergencies"
            message="Checking active SOS alerts near you..."
            style={styles.inlineState}
          />
        ) : nearbyEmergenciesQuery.isError ? (
          <ErrorState
            title="Unable to load emergencies"
            message="Nearby emergencies could not be loaded right now."
            onRetry={() => {
              void nearbyEmergenciesQuery.refetch();
            }}
            style={styles.inlineState}
          />
        ) : latestEmergencies.length > 0 ? (
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text variant="headingSmall" color="onSurface">
                Latest Active SOS
              </Text>

              <Button
                title="View All"
                size="sm"
                variant="ghost"
                onPress={() => navigation.navigate('NearbyEmergenciesList')}
              />
            </View>

            <View style={styles.emergencyList}>
              {latestEmergencies.map(emergency => (
                <PressableCard
                  key={emergency.id}
                  variant="outlined"
                  onPress={() => handleOpenEmergency(emergency.id)}
                  style={styles.emergencyCard}>
                  <View style={styles.emergencyIconWrap}>
                    <ShieldAlert color={colors.primary} size={24} />
                  </View>

                  <View style={styles.emergencyContent}>
                    <View style={styles.emergencyHeader}>
                      <Text
                        variant="labelLarge"
                        color="onSurface"
                        numberOfLines={1}
                        style={styles.emergencyTitle}>
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
                      style={styles.emergencyDescription}>
                      {emergency.description ||
                        'No extra description was provided.'}
                    </Text>

                    <View style={styles.emergencyFooter}>
                      <Text variant="caption" color="onSurfaceVariant">
                        {formatStatus(emergency.status)}
                      </Text>

                      <Text variant="caption" color="onSurfaceVariant">
                        {formatCreatedAt(emergency.createdAt)}
                      </Text>
                    </View>
                  </View>
                </PressableCard>
              ))}
            </View>
          </View>
        ) : (
          <EmptyState
            title="No active emergencies nearby"
            message="There are no active SOS alerts in your selected radius right now."
            style={styles.inlineState}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  mapWrap: {
    height: 360,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  mapTopOverlay: {
    left: spacing.screenHorizontal,
    position: 'absolute',
    top: spacing.md,
  },
  mapBottomOverlay: {
    bottom: spacing.lg,
    right: spacing.screenHorizontal,
    position: 'absolute',
  },
  currentLocationMarker: {
    alignItems: 'center',
    backgroundColor: colors.mapCurrentUserMarker,
    borderColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emergencyMarker: {
    alignItems: 'center',
    backgroundColor: colors.mapEmergencyMarker,
    borderColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 3,
    height: 46,
    justifyContent: 'center',
    width: 46,
    ...shadows.md,
  },
  criticalMarker: {
    height: 54,
    width: 54,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.screenVertical,
  },
  locationCard: {},
  locationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  locationTitleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationText: {
    marginTop: spacing.sm,
  },
  inlineState: {
    marginTop: spacing.lg,
  },
  previewSection: {
    marginTop: spacing.lg,
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  emergencyList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  emergencyCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  emergencyIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  emergencyTitle: {
    flex: 1,
  },
  emergencyDescription: {
    marginTop: spacing.xs,
  },
  emergencyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});