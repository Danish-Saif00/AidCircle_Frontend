import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {BellRing, CheckCircle2, MapPin, Settings} from 'lucide-react-native';

import type {AppScreenProps} from '../../navigation/navigation.types';
import {locationsApi} from '../../services/api';
import {locationService} from '../../services/location/location.service';
import {pushService} from '../../services/notifications/push.service';
import {Button, Card, Screen, Text} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';
import {useAppStore} from '../../store';

type PermissionsSetupScreenProps = AppScreenProps<'PermissionsSetup'>;

type PermissionStepStatus = 'pending' | 'completed' | 'failed';

type PermissionStepCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: PermissionStepStatus;
};

const getStatusLabel = (status: PermissionStepStatus): string => {
  switch (status) {
    case 'completed':
      return 'Enabled';
    case 'failed':
      return 'Needs attention';
    case 'pending':
    default:
      return 'Pending';
  }
};

const getStatusColor = (status: PermissionStepStatus) => {
  switch (status) {
    case 'completed':
      return colors.success;
    case 'failed':
      return colors.error;
    case 'pending':
    default:
      return colors.onSurfaceVariant;
  }
};

const PermissionStepCard = ({
  icon,
  title,
  description,
  status,
}: PermissionStepCardProps) => {
  const statusColor = getStatusColor(status);

  return (
    <Card variant="outlined" style={styles.stepCard}>
      <View style={styles.stepIconWrap}>{icon}</View>

      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Text variant="labelLarge" color="onSurface">
            {title}
          </Text>

          <Text variant="labelSmall" color="onSurfaceVariant">
            {getStatusLabel(status)}
          </Text>
        </View>

        <Text
          variant="bodySmall"
          color="onSurfaceVariant"
          style={styles.stepDescription}>
          {description}
        </Text>
      </View>

      <CheckCircle2 color={statusColor} size={22} />
    </Card>
  );
};

export const PermissionsSetupScreen = ({
  navigation,
}: PermissionsSetupScreenProps) => {
  const [locationStatus, setLocationStatus] =
    useState<PermissionStepStatus>('pending');
  const [notificationStatus, setNotificationStatus] =
    useState<PermissionStepStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);
  const setPermissionsSetupCompleted = useAppStore(
    state => state.setPermissionsSetupCompleted,
  );

  const navigateToHome = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: {
            screen: 'HomeTab',
            params: {
              screen: 'HomeMapSos',
            },
          },
        },
      ],
    });
  };

  const handleSetup = async () => {
    setIsSubmitting(true);

    try {
      setLocationStatus('pending');

      const currentLocation =
        await locationService.requestPermissionAndGetLocation();

      const savedLocation = await locationsApi.updateMe({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracyMeters: currentLocation.accuracyMeters ?? undefined,
      });

      setCurrentLocation({
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        accuracyMeters: savedLocation.accuracyMeters,
        updatedAt: savedLocation.lastUpdatedAt,
      });

      setLocationStatus('completed');

      try {
        setNotificationStatus('pending');
        await pushService.registerCurrentDevice();
        setNotificationStatus('completed');
      } catch (error) {
        setNotificationStatus('failed');

        Alert.alert(
          'Notification setup skipped',
          `${getApiErrorMessage(
            error,
            'Push notifications could not be enabled right now.',
          )}\n\nYou can continue, but emergency push alerts may not work until notifications are enabled.`,
        );
      }

      await setPermissionsSetupCompleted(true);
      navigateToHome();
    } catch (error) {
      setLocationStatus('failed');

      Alert.alert(
        'Location setup failed',
        getApiErrorMessage(
          error,
          'Location permission is required to use AidCircle emergency features.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await locationService.openAppSettings();
    } catch {
      Alert.alert('Settings unavailable', 'Unable to open app settings.');
    }
  };

  return (
    <Screen
      scrollable
      safeArea
      contentContainerStyle={styles.screenContent}
      statusBarStyle="dark-content">
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Settings color={colors.onPrimary} size={36} strokeWidth={2.4} />
        </View>

        <Text
          variant="displaySmall"
          color="onSurface"
          align="center"
          style={styles.title}>
          Setup Permissions
        </Text>

        <Text
          variant="bodyMedium"
          color="onSurfaceVariant"
          align="center"
          style={styles.subtitle}>
          AidCircle needs location and notification access to create SOS alerts
          and notify nearby helpers.
        </Text>
      </View>

      <View style={styles.steps}>
        <PermissionStepCard
          icon={<MapPin color={colors.primary} size={24} />}
          title="Location Access"
          description="Used to save your current location and send accurate SOS alerts."
          status={locationStatus}
        />

        <PermissionStepCard
          icon={<BellRing color={colors.secondary} size={24} />}
          title="Push Notifications"
          description="Used to send and receive nearby emergency alerts."
          status={notificationStatus}
        />
      </View>

      <Card variant="danger" style={styles.warningCard}>
        <Text variant="labelLarge" color="onErrorContainer">
          Important
        </Text>

        <Text
          variant="bodySmall"
          color="onErrorContainer"
          style={styles.warningText}>
          AidCircle is a community support app. For life-threatening situations,
          contact official emergency services immediately.
        </Text>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Enable Permissions"
          fullWidth
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleSetup}
        />

        <Button
          title="Open App Settings"
          fullWidth
          size="lg"
          variant="outline"
          disabled={isSubmitting}
          onPress={handleOpenSettings}
          style={styles.settingsButton}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  title: {
    marginTop: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: 330,
  },
  steps: {
    gap: spacing.md,
    marginTop: spacing.xxxl,
  },
  stepCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  stepDescription: {
    marginTop: spacing.xxs,
  },
  warningCard: {
    marginTop: spacing.xxl,
  },
  warningText: {
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.xxxl,
  },
  settingsButton: {
    marginTop: spacing.md,
  },
});