import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {
  ArrowLeft,
  CheckCircle2,
  LocateFixed,
  MapPin,
  Send,
  ShieldAlert,
} from 'lucide-react-native';

import {APP_CONFIG} from '../../config/constants';
import type {AppScreenProps} from '../../navigation/navigation.types';
import {emergenciesApi, locationsApi} from '../../services/api';
import {locationService} from '../../services/location/location.service';
import {
  Button,
  Card,
  Header,
  LoadingState,
  Screen,
  StatusBadge,
  Text,
} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';
import {useAppStore} from '../../store';

type ConfirmSosScreenProps = AppScreenProps<'ConfirmSos'>;

export const ConfirmSosScreen = ({
  navigation,
  route,
}: ConfirmSosScreenProps) => {
  const {categoryId, categoryName, title, description, priority} = route.params;

  const [isSending, setIsSending] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  const currentLocation = useAppStore(state => state.currentLocation);
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);

  const formattedLocation = useMemo(() => {
    if (!currentLocation) {
      return 'Location not ready';
    }

    return `${currentLocation.latitude.toFixed(
      6,
    )}, ${currentLocation.longitude.toFixed(6)}`;
  }, [currentLocation]);

  const refreshLocation = async () => {
    setIsRefreshingLocation(true);

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
        'Location refresh failed',
        getApiErrorMessage(
          error,
          'Unable to refresh your current location right now.',
        ),
      );
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  const handleSendSos = async () => {
    setIsSending(true);

    try {
      let location = currentLocation;

      if (!location) {
        const deviceLocation =
          await locationService.requestPermissionAndGetLocation();

        const savedLocation = await locationsApi.updateMe({
          latitude: deviceLocation.latitude,
          longitude: deviceLocation.longitude,
          accuracyMeters: deviceLocation.accuracyMeters ?? undefined,
        });

        location = {
          latitude: savedLocation.latitude,
          longitude: savedLocation.longitude,
          accuracyMeters: savedLocation.accuracyMeters,
          updatedAt: savedLocation.lastUpdatedAt,
        };

        setCurrentLocation(location);
      }

      const emergency = await emergenciesApi.create({
        categoryId,
        title,
        description,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: APP_CONFIG.DEFAULT_ALERT_RADIUS_KM,
        priority,
      });

      navigation.replace('LiveSosStatus', {
        emergencyId: emergency.id,
      });
    } catch (error) {
      Alert.alert(
        'SOS failed',
        getApiErrorMessage(
          error,
          'Unable to send SOS alert. Please check your connection and try again.',
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Screen
      safeArea
      scrollable
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Confirm SOS"
        subtitle="Review before sending"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
      />

      <View style={styles.content}>
        <Card variant="danger" style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <ShieldAlert color={colors.onErrorContainer} size={34} />
          </View>

          <Text
            variant="headingSmall"
            color="onErrorContainer"
            align="center"
            style={styles.alertTitle}>
            Ready to Send SOS
          </Text>

          <Text
            variant="bodySmall"
            color="onErrorContainer"
            align="center"
            style={styles.alertText}>
            Nearby available helpers will be notified with your emergency
            details and current location.
          </Text>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Emergency Details
            </Text>
          </View>

          <View style={styles.detailRows}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Category
              </Text>

              <Text
                variant="labelLarge"
                color="onSurface"
                align="right"
                style={styles.detailValue}>
                {categoryName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Priority
              </Text>

              <StatusBadge
                label={(priority ?? 'high').toUpperCase()}
                tone={
                  priority === 'critical' || priority === 'high'
                    ? 'danger'
                    : priority === 'medium'
                      ? 'warning'
                      : 'neutral'
                }
                size="sm"
              />
            </View>

            <View style={styles.detailColumn}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Title
              </Text>

              <Text
                variant="labelLarge"
                color="onSurface"
                style={styles.detailText}>
                {title}
              </Text>
            </View>

            {description ? (
              <View style={styles.detailColumn}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Description
                </Text>

                <Text
                  variant="bodyMedium"
                  color="onSurface"
                  style={styles.detailText}>
                  {description}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationTitleWrap}>
              <MapPin color={colors.primary} size={22} />

              <Text variant="labelLarge" color="onSurface">
                Location
              </Text>
            </View>

            <Button
              title="Refresh"
              size="sm"
              variant="outline"
              loading={isRefreshingLocation}
              disabled={isRefreshingLocation || isSending}
              onPress={refreshLocation}
            />
          </View>

          {isRefreshingLocation ? (
            <LoadingState
              title="Refreshing location"
              message="Getting latest GPS position..."
              style={styles.inlineLoading}
            />
          ) : (
            <View style={styles.locationDetails}>
              <View style={styles.locationIconWrap}>
                <LocateFixed color={colors.onPrimary} size={24} />
              </View>

              <View style={styles.locationTextWrap}>
                <Text variant="bodySmall" color="onSurfaceVariant">
                  Current coordinates
                </Text>

                <Text
                  variant="labelLarge"
                  color={currentLocation ? 'onSurface' : 'error'}
                  style={styles.locationValue}>
                  {formattedLocation}
                </Text>

                <Text
                  variant="bodySmall"
                  color="onSurfaceVariant"
                  style={styles.locationHint}>
                  Radius: {APP_CONFIG.DEFAULT_ALERT_RADIUS_KM} km
                </Text>
              </View>
            </View>
          )}
        </Card>

        <Card variant="outlined" style={styles.noticeCard}>
          <Text variant="labelLarge" color="onSurface">
            Before sending
          </Text>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.noticeText}>
            Send SOS only for real emergency situations. False or misleading
            reports may be reviewed by admins.
          </Text>
        </Card>

        <Button
          title="Send SOS Alert"
          fullWidth
          size="lg"
          variant="danger"
          loading={isSending}
          disabled={isSending || isRefreshingLocation}
          leftIcon={<Send color={colors.onDanger} size={20} />}
          onPress={handleSendSos}
          style={styles.sendButton}
        />
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
  alertCard: {
    alignItems: 'center',
  },
  alertIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  alertTitle: {
    marginTop: spacing.md,
  },
  alertText: {
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailRows: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  detailColumn: {
    gap: spacing.xs,
  },
  detailValue: {
    flex: 1,
  },
  detailText: {
    marginTop: spacing.xxs,
  },
  locationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  locationTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineLoading: {
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
  },
  locationDetails: {
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
  locationValue: {
    marginTop: spacing.xxs,
  },
  locationHint: {
    marginTop: spacing.xxs,
  },
  noticeCard: {
    marginTop: spacing.lg,
  },
  noticeText: {
    marginTop: spacing.xs,
  },
  sendButton: {
    marginTop: spacing.xxxl,
  },
});