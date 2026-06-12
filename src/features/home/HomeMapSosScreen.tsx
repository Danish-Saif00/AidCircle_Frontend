import React, {useCallback, useMemo, useState} from 'react';
import {Alert, Platform, StyleSheet, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import MapView, {Marker, type Region} from 'react-native-maps';
import {
  AlertTriangle,
  LocateFixed,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Users,
} from 'lucide-react-native';

import {APP_CONFIG} from '../../config/constants';
import type {HomeScreenProps} from '../../navigation/navigation.types';
import {emergenciesApi, locationsApi} from '../../services/api';
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

type HomeMapSosScreenProps = HomeScreenProps<'HomeMapSos'>;

const DEFAULT_REGION: Region = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const createRegion = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
});

export const HomeMapSosScreen = ({navigation}: HomeMapSosScreenProps) => {
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const currentLocation = useAppStore(state => state.currentLocation);
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);

  const region = useMemo<Region>(() => {
    if (!currentLocation) {
      return DEFAULT_REGION;
    }

    return createRegion(currentLocation.latitude, currentLocation.longitude);
  }, [currentLocation]);

  const categoriesQuery = useQuery({
    queryKey: ['emergencies', 'categories'],
    queryFn: emergenciesApi.getCategories,
  });

  const nearbyUsersQuery = useQuery({
    queryKey: [
      'locations',
      'nearby-users',
      currentLocation?.latitude,
      currentLocation?.longitude,
      APP_CONFIG.DEFAULT_ALERT_RADIUS_KM,
    ],
    queryFn: () =>
      locationsApi.getNearbyUsers({
        latitude: currentLocation?.latitude ?? DEFAULT_REGION.latitude,
        longitude: currentLocation?.longitude ?? DEFAULT_REGION.longitude,
        radiusKm: APP_CONFIG.DEFAULT_ALERT_RADIUS_KM,
      }),
    enabled: Boolean(currentLocation),
  });

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
      }
    }, [currentLocation, updateCurrentLocation]),
  );

  const handleRefresh = async () => {
    await updateCurrentLocation();
    await Promise.all([
      categoriesQuery.refetch(),
      currentLocation ? nearbyUsersQuery.refetch() : Promise.resolve(),
    ]);
  };

  const handleCreateSos = () => {
    if (categoriesQuery.isLoading) {
      return;
    }

    if (categoriesQuery.isError || !categoriesQuery.data?.length) {
      Alert.alert(
        'Categories unavailable',
        'Emergency categories could not be loaded. Please refresh and try again.',
      );
      return;
    }

    navigation.getParent()?.getParent()?.dispatch({
      type: 'NAVIGATE',
      payload: {
        name: 'SelectCategory',
      },
    });
  };

  const nearbyHelpersCount = nearbyUsersQuery.data?.length ?? 0;
  const activeCategoriesCount = categoriesQuery.data?.length ?? 0;

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="AidCircle"
        subtitle="Emergency support nearby"
        rightAction={{
          accessibilityLabel: 'Refresh home data',
          disabled: isUpdatingLocation,
          icon: (
            <RefreshCcw
              color={
                isUpdatingLocation ? colors.onDisabled : colors.onSurface
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
          showsUserLocation={Platform.OS !== 'android'}
          showsMyLocationButton={false}
          toolbarEnabled={false}>
          {currentLocation ? (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your location"
              description="Current saved AidCircle location">
              <View style={styles.currentLocationMarker}>
                <LocateFixed color={colors.white} size={20} />
              </View>
            </Marker>
          ) : null}

          {nearbyUsersQuery.data?.map(user => {
            if (
              typeof user.latitude !== 'number' ||
              typeof user.longitude !== 'number'
            ) {
              return null;
            }

            return (
              <Marker
                key={user.id}
                coordinate={{
                  latitude: user.latitude,
                  longitude: user.longitude,
                }}
                title={user.fullName}
                description="Available nearby helper">
                <View style={styles.helperMarker}>
                  <Users color={colors.white} size={18} />
                </View>
              </Marker>
            );
          })}
        </MapView>

        <View style={styles.mapOverlayTop}>
          <StatusBadge
            label={
              currentLocation
                ? 'Location active'
                : isUpdatingLocation
                  ? 'Finding location'
                  : 'Location needed'
            }
            tone={currentLocation ? 'success' : 'warning'}
            dot
          />
        </View>

        <View style={styles.sosButtonWrap}>
          <PressableCard
            variant="elevated"
            padding="none"
            onPress={handleCreateSos}
            style={styles.sosButton}>
            <AlertTriangle color={colors.onPrimary} size={42} strokeWidth={2.8} />

            <Text
              variant="displaySmall"
              color="onPrimary"
              weight="800"
              style={styles.sosText}>
              SOS
            </Text>

            <Text variant="labelSmall" color="onPrimary" align="center">
              Tap to create alert
            </Text>
          </PressableCard>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <Card variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <ShieldCheck color={colors.primary} size={22} />
          </View>

          <Text variant="headingSmall" color="onSurface" style={styles.summaryValue}>
            {activeCategoriesCount}
          </Text>

          <Text variant="bodySmall" color="onSurfaceVariant">
            SOS categories
          </Text>
        </Card>

        <Card variant="outlined" style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Users color={colors.success} size={22} />
          </View>

          <Text variant="headingSmall" color="onSurface" style={styles.summaryValue}>
            {nearbyHelpersCount}
          </Text>

          <Text variant="bodySmall" color="onSurfaceVariant">
            Nearby helpers
          </Text>
        </Card>
      </View>

      <Card variant="outlined" style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={styles.locationTitleWrap}>
            <MapPin color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Current Location
            </Text>
          </View>

          <Button
            title="Update"
            size="sm"
            variant="outline"
            loading={isUpdatingLocation}
            disabled={isUpdatingLocation}
            onPress={updateCurrentLocation}
          />
        </View>

        {currentLocation ? (
          <View style={styles.locationDetails}>
            <Text variant="bodySmall" color="onSurfaceVariant">
              Latitude: {currentLocation.latitude.toFixed(6)}
            </Text>

            <Text variant="bodySmall" color="onSurfaceVariant">
              Longitude: {currentLocation.longitude.toFixed(6)}
            </Text>

            <Text variant="bodySmall" color="onSurfaceVariant">
              Accuracy:{' '}
              {currentLocation.accuracyMeters
                ? `${Math.round(currentLocation.accuracyMeters)}m`
                : 'Unknown'}
            </Text>
          </View>
        ) : (
          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.locationEmptyText}>
            Location is required before creating SOS alerts.
          </Text>
        )}
      </Card>

      {categoriesQuery.isLoading ? (
        <LoadingState
          title="Loading categories"
          message="Preparing SOS options..."
          style={styles.inlineState}
        />
      ) : categoriesQuery.isError ? (
        <ErrorState
          title="Categories unavailable"
          message="Emergency categories could not be loaded."
          onRetry={() => {
            void categoriesQuery.refetch();
          }}
          style={styles.inlineState}
        />
      ) : categoriesQuery.data?.length ? (
        <View style={styles.categoriesPreview}>
          <Text variant="headingSmall" color="onSurface">
            Emergency Categories
          </Text>

          <View style={styles.categoryList}>
            {categoriesQuery.data.slice(0, 3).map(category => (
              <Card key={category.id} variant="outlined" style={styles.categoryCard}>
                <Text variant="labelLarge" color="onSurface" numberOfLines={1}>
                  {category.name}
                </Text>

                <StatusBadge
                  label={category.priority}
                  tone={
                    category.priority === 'critical' ||
                    category.priority === 'high'
                      ? 'danger'
                      : category.priority === 'medium'
                        ? 'warning'
                        : 'neutral'
                  }
                  size="sm"
                  style={styles.categoryBadge}
                />
              </Card>
            ))}
          </View>
        </View>
      ) : (
        <EmptyState
          title="No categories found"
          message="SOS categories are not available yet."
          style={styles.inlineState}
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
  mapWrap: {
    borderRadius: radius.xxl,
    height: 340,
    marginHorizontal: spacing.screenHorizontal,
    marginTop: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  mapOverlayTop: {
    left: spacing.md,
    position: 'absolute',
    top: spacing.md,
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
  helperMarker: {
    alignItems: 'center',
    backgroundColor: colors.mapHelperMarker,
    borderColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 2,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sosButtonWrap: {
    alignItems: 'center',
    bottom: spacing.xl,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  sosButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sosButton,
    height: spacing.sosButtonSize,
    justifyContent: 'center',
    width: spacing.sosButtonSize,
    ...shadows.sosButton,
  },
  sosText: {
    marginTop: spacing.xs,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.screenHorizontal,
    marginTop: spacing.lg,
  },
  summaryCard: {
    flex: 1,
  },
  summaryIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  summaryValue: {
    marginTop: spacing.md,
  },
  locationCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginTop: spacing.lg,
  },
  locationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  locationTitleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationDetails: {
    gap: spacing.xxs,
    marginTop: spacing.md,
  },
  locationEmptyText: {
    marginTop: spacing.md,
  },
  inlineState: {
    marginHorizontal: spacing.screenHorizontal,
    marginTop: spacing.lg,
  },
  categoriesPreview: {
    marginHorizontal: spacing.screenHorizontal,
    marginTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  categoryList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  categoryCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  categoryBadge: {
    flexShrink: 0,
  },
});