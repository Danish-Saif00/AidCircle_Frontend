import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCcw,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import type {AppScreenProps} from '../../navigation/navigation.types';
import {usersApi, type PublicUserProfile} from '../../services/api';
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
import {colors, radius, spacing} from '../../shared/theme';

type PublicUserProfileScreenProps = AppScreenProps<'PublicUserProfile'>;

const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const getRoleLabel = (role: PublicUserProfile['role']): string => {
  return role.replace('_', ' ').toUpperCase();
};

export const PublicUserProfileScreen = ({
  navigation,
  route,
}: PublicUserProfileScreenProps) => {
  const {userId} = route.params;

  const profileQuery = useQuery({
    queryKey: ['users', 'public-profile', userId],
    queryFn: () => usersApi.getPublicProfile(userId),
  });

  const profile = profileQuery.data;

  const handleReportUser = () => {
    if (!profile) {
      Alert.alert('Profile unavailable', 'User profile is not loaded yet.');
      return;
    }

    navigation.dispatch(
      CommonActions.navigate({
        name: 'CreateReport',
        params: {
          targetType: 'user',
          targetId: userId,
          contextTitle: profile.fullName,
        },
      }),
    );
  };

  if (profileQuery.isLoading) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Public Profile"
          subtitle="Loading user"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
        />

        <LoadingState
          title="Loading profile"
          message="Getting public user details..."
          fullScreen
        />
      </Screen>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Public Profile"
          subtitle="Unable to load"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
          rightAction={{
            accessibilityLabel: 'Retry public profile',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void profileQuery.refetch();
            },
          }}
        />

        <ErrorState
          title="Profile unavailable"
          message="This public profile could not be loaded right now."
          onRetry={() => {
            void profileQuery.refetch();
          }}
          fullScreen
        />
      </Screen>
    );
  }

  return (
    <Screen
      safeArea
      scrollable
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Public Profile"
        subtitle="Visible emergency identity"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh public profile',
          disabled: profileQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                profileQuery.isRefetching ? colors.onDisabled : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: () => {
            void profileQuery.refetch();
          },
        }}
      />

      <View style={styles.content}>
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text variant="headingMedium" color="onPrimary">
              {getInitials(profile.fullName)}
            </Text>
          </View>

          <Text
            variant="headingSmall"
            color="onSurface"
            align="center"
            style={styles.name}>
            {profile.fullName}
          </Text>

          <View style={styles.badges}>
            <StatusBadge label={getRoleLabel(profile.role)} tone="info" dot />

            <StatusBadge
              label={profile.isVerified ? 'Verified' : 'Unverified'}
              tone={profile.isVerified ? 'success' : 'warning'}
            />

            <StatusBadge
              label={profile.isHelperAvailable ? 'Helper Available' : 'Helper Off'}
              tone={profile.isHelperAvailable ? 'success' : 'neutral'}
            />
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Public Identity
            </Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Role
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {getRoleLabel(profile.role)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Verified
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {profile.isVerified ? 'Yes' : 'No'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" color="onSurfaceVariant">
                Helper Availability
              </Text>

              <Text variant="labelMedium" color="onSurface" align="right">
                {profile.isHelperAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ShieldCheck color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Trust Notice
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.noticeText}>
            This profile only shows public safety information needed during SOS
            response. Private account data is not shown here.
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Report User"
            fullWidth
            size="lg"
            variant="danger"
            leftIcon={<AlertTriangle color={colors.onDanger} size={20} />}
            onPress={handleReportUser}
          />

          <Button
            title="Go Back"
            fullWidth
            size="lg"
            variant="outline"
            leftIcon={<Shield color={colors.primary} size={20} />}
            onPress={navigation.goBack}
            style={styles.backButton}
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
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  name: {
    marginTop: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
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
  noticeText: {
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    marginTop: spacing.md,
  },
});