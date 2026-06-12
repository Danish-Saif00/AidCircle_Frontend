import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  Flag,
  LocateFixed,
  MapPin,
  PhoneCall,
  RefreshCcw,
  ShieldAlert,
  User,
  UserRoundSearch,
} from 'lucide-react-native';

import {EMERGENCY_STATUSES} from '../../config/constants';
import type {HelperScreenProps} from '../../navigation/navigation.types';
import {
  emergenciesApi,
  respondersApi,
  usersApi,
  type Emergency,
  type PublicUserProfile,
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

type EmergencyDetailHelperScreenProps =
  HelperScreenProps<'EmergencyDetailHelper'>;

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

const getStatusTone = (
  status: Emergency['status'],
): 'neutral' | 'success' | 'warning' | 'danger' => {
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

const formatStatusLabel = (status: Emergency['status']): string => {
  return status.replace('_', ' ').toUpperCase();
};

const PublicRequesterCard = ({
  profile,
  onOpenProfile,
}: {
  profile?: PublicUserProfile;
  onOpenProfile: () => void;
}) => {
  return (
    <Card variant="outlined" style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <User color={colors.primary} size={22} />

        <Text variant="labelLarge" color="onSurface">
          Requester
        </Text>
      </View>

      {profile ? (
        <View style={styles.requesterBox}>
          <View style={styles.avatarCircle}>
            <Text variant="headingSmall" color="onPrimary">
              {profile.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.requesterInfo}>
            <Text variant="labelLarge" color="onSurface" numberOfLines={1}>
              {profile.fullName}
            </Text>

            <View style={styles.requesterBadges}>
              <StatusBadge
                label={profile.isVerified ? 'Verified' : 'Unverified'}
                tone={profile.isVerified ? 'success' : 'warning'}
                size="sm"
              />

              <StatusBadge label={profile.role} tone="info" size="sm" />
            </View>
          </View>
        </View>
      ) : (
        <Text
          variant="bodySmall"
          color="onSurfaceVariant"
          style={styles.emptyText}>
          Requester public profile is not available right now.
        </Text>
      )}

      <Button
        title="View Public Profile"
        variant="outline"
        fullWidth
        leftIcon={<UserRoundSearch color={colors.primary} size={18} />}
        onPress={onOpenProfile}
        style={styles.sectionAction}
      />
    </Card>
  );
};

export const EmergencyDetailHelperScreen = ({
  navigation,
  route,
}: EmergencyDetailHelperScreenProps) => {
  const {emergencyId} = route.params;

  const queryClient = useQueryClient();

  const emergencyQuery = useQuery({
    queryKey: ['emergencies', 'detail', emergencyId],
    queryFn: () => emergenciesApi.getById(emergencyId),
  });

  const emergency = emergencyQuery.data;

  const requesterQuery = useQuery({
    queryKey: ['users', 'public-profile', emergency?.requesterId],
    queryFn: () => usersApi.getPublicProfile(emergency!.requesterId),
    enabled: Boolean(emergency?.requesterId),
  });

  const acceptMutation = useMutation({
    mutationFn: () => respondersApi.acceptEmergency(emergencyId),
    onSuccess: async responder => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['responders', 'active'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['emergencies', 'detail', emergencyId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['locations', 'nearby-emergencies'],
        }),
      ]);

      navigation.replace('AcceptedEmergencyActive', {
        emergencyId,
        responderId: responder.id,
        initialStatus: responder.status,
      });
    },
    onError: error => {
      Alert.alert(
        'Unable to accept SOS',
        getApiErrorMessage(
          error,
          'This emergency could not be accepted right now.',
        ),
      );
    },
  });

  const handleRefresh = async () => {
    await Promise.all([
      emergencyQuery.refetch(),
      requesterQuery.refetch(),
    ]);
  };

  const handleOpenRequesterProfile = () => {
    if (!emergency?.requesterId) {
      return;
    }

    navigation.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'PublicUserProfile',
        params: {
          userId: emergency.requesterId,
        },
      }),
    );
  };

  const handleReportEmergency = () => {
    navigation.getParent()?.dispatch(
      CommonActions.navigate({
        name: 'CreateReport',
        params: {
          targetType: 'emergency',
          targetId: emergencyId,
          contextTitle: emergency?.title,
        },
      }),
    );
  };

  const handleAcceptEmergency = () => {
    if (!emergency) {
      return;
    }

    if (emergency.status !== EMERGENCY_STATUSES.ACTIVE) {
      Alert.alert(
        'SOS not active',
        'This emergency is no longer active and cannot be accepted.',
      );
      return;
    }

    Alert.alert(
      'Accept this SOS?',
      'You will be marked as a responder for this emergency.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          style: 'default',
          onPress: () => acceptMutation.mutate(),
        },
      ],
    );
  };

  if (emergencyQuery.isLoading) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Emergency Detail"
          subtitle="Loading SOS"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
        />

        <LoadingState
          title="Loading emergency"
          message="Getting SOS details..."
          fullScreen
        />
      </Screen>
    );
  }

  if (emergencyQuery.isError || !emergency) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Emergency Detail"
          subtitle="Unable to load"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
          rightAction={{
            accessibilityLabel: 'Retry',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void emergencyQuery.refetch();
            },
          }}
        />

        <ErrorState
          title="Emergency unavailable"
          message="This emergency could not be loaded right now."
          onRetry={() => {
            void emergencyQuery.refetch();
          }}
          fullScreen
        />
      </Screen>
    );
  }

  const isActive = emergency.status === EMERGENCY_STATUSES.ACTIVE;

  return (
    <Screen
      safeArea
      scrollable
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Emergency Detail"
        subtitle="Review before responding"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh emergency detail',
          disabled: emergencyQuery.isRefetching || requesterQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                emergencyQuery.isRefetching || requesterQuery.isRefetching
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
        <Card
          variant={isActive ? 'danger' : 'outlined'}
          style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <ShieldAlert
              color={isActive ? colors.onErrorContainer : colors.primary}
              size={36}
            />
          </View>

          <Text
            variant="headingSmall"
            color={isActive ? 'onErrorContainer' : 'onSurface'}
            align="center"
            style={styles.heroTitle}>
            {emergency.title}
          </Text>

          <View style={styles.heroBadges}>
            <StatusBadge
              label={formatStatusLabel(emergency.status)}
              tone={getStatusTone(emergency.status)}
              dot
            />

            <StatusBadge
              label={emergency.priority.toUpperCase()}
              tone={getPriorityTone(emergency.priority)}
            />
          </View>

          <Text
            variant="bodySmall"
            color={isActive ? 'onErrorContainer' : 'onSurfaceVariant'}
            align="center"
            style={styles.heroText}>
            {isActive
              ? 'This SOS is active. Accept only if you are able to help safely.'
              : 'This SOS is no longer active.'}
          </Text>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Flag color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Emergency Information
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailColumn}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Description
              </Text>

              <Text
                variant="bodyMedium"
                color="onSurface"
                style={styles.detailText}>
                {emergency.description || 'No extra description was provided.'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Radius
              </Text>

              <Text variant="labelMedium" color="onSurface">
                {emergency.radiusKm} km
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Created
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(emergency.createdAt)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Expires
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {formatDateTime(emergency.expiresAt)}
              </Text>
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
                {emergency.latitude.toFixed(6)}, {emergency.longitude.toFixed(6)}
              </Text>
            </View>
          </View>

          <Text
            variant="caption"
            color="onSurfaceVariant"
            style={styles.locationNote}>
            Map routing is not implemented yet. Use coordinates for reference.
          </Text>
        </Card>

        <PublicRequesterCard
          profile={requesterQuery.data}
          onOpenProfile={handleOpenRequesterProfile}
        />

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clock color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Response Guidance
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.guidanceText}>
            Accept only if you can respond safely. Do not put yourself or others
            at risk. For serious emergencies, official emergency services should
            also be contacted.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Accept Emergency"
            fullWidth
            size="lg"
            variant="danger"
            loading={acceptMutation.isPending}
            disabled={!isActive || acceptMutation.isPending}
            leftIcon={<PhoneCall color={colors.onDanger} size={20} />}
            onPress={handleAcceptEmergency}
          />

          <Button
            title="Report This Emergency"
            fullWidth
            size="lg"
            variant="outline"
            disabled={acceptMutation.isPending}
            onPress={handleReportEmergency}
            style={styles.reportButton}
          />
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
  locationNote: {
    marginTop: spacing.sm,
  },
  requesterBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  requesterInfo: {
    flex: 1,
  },
  requesterBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionAction: {
    marginTop: spacing.md,
  },
  emptyText: {
    marginTop: spacing.md,
  },
  guidanceText: {
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  reportButton: {
    marginTop: spacing.md,
  },
});