import React, {useMemo, useState} from 'react';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  HeartPulse,
  RefreshCcw,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import {
  BLOOD_GROUPS,
  type BloodGroup,
  VALIDATION_LIMITS,
} from '../../config/constants';
import type {ProfileScreenProps} from '../../navigation/navigation.types';
import {usersApi, type UpdateProfileRequest} from '../../services/api';
import {
  Button,
  Card,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  StatusBadge,
  Text,
  TextInput,
} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';
import {useAuthStore} from '../../store';

type EditProfileScreenProps = ProfileScreenProps<'EditProfile'>;

const bloodGroupOptions: BloodGroup[] = [...BLOOD_GROUPS];

const isBloodGroup = (value: string | null | undefined): value is BloodGroup => {
  return typeof value === 'string' && BLOOD_GROUPS.includes(value as BloodGroup);
};

export const EditProfileScreen = ({navigation}: EditProfileScreenProps) => {
  const queryClient = useQueryClient();

  const storedProfile = useAuthStore(state => state.profile);
  const updateStoredProfile = useAuthStore(state => state.updateProfile);

  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    initialData: storedProfile ?? undefined,
  });

  const profile = profileQuery.data;

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(
    isBloodGroup(profile?.bloodGroup) ? profile.bloodGroup : null,
  );
  const [medicalNotes, setMedicalNotes] = useState(profile?.medicalNotes ?? '');
  const [isHelperAvailable, setIsHelperAvailable] = useState(
    profile?.isHelperAvailable ?? false,
  );

  const fullNameError = useMemo(() => {
    const value = fullName.trim();

    if (value.length < VALIDATION_LIMITS.FULL_NAME_MIN) {
      return `Full name must be at least ${VALIDATION_LIMITS.FULL_NAME_MIN} characters.`;
    }

    if (value.length > VALIDATION_LIMITS.FULL_NAME_MAX) {
      return `Full name must be less than ${VALIDATION_LIMITS.FULL_NAME_MAX} characters.`;
    }

    return undefined;
  }, [fullName]);

  const medicalNotesError = useMemo(() => {
    const value = medicalNotes.trim();

    if (value.length > VALIDATION_LIMITS.MEDICAL_NOTES_MAX) {
      return `Medical notes must be less than ${VALIDATION_LIMITS.MEDICAL_NOTES_MAX} characters.`;
    }

    return undefined;
  }, [medicalNotes]);

  const canSave = !fullNameError && !medicalNotesError;

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => usersApi.updateMe(payload),
    onSuccess: async updatedProfile => {
      updateStoredProfile(updatedProfile);

      await queryClient.invalidateQueries({
        queryKey: ['users', 'me'],
      });

      Alert.alert('Profile updated', 'Your profile has been updated.');

      navigation.goBack();
    },
    onError: error => {
      Alert.alert(
        'Update failed',
        getApiErrorMessage(error, 'Your profile could not be updated right now.'),
      );
    },
  });

  const handleRefresh = async () => {
    const result = await profileQuery.refetch();

    if (result.data) {
      setFullName(result.data.fullName);
      setBloodGroup(
        isBloodGroup(result.data.bloodGroup) ? result.data.bloodGroup : null,
      );
      setMedicalNotes(result.data.medicalNotes ?? '');
      setIsHelperAvailable(result.data.isHelperAvailable);
      updateStoredProfile(result.data);
    }
  };

  const handleSave = () => {
    if (!canSave) {
      Alert.alert(
        'Check profile details',
        fullNameError ||
          medicalNotesError ||
          'Please fix the highlighted fields.',
      );
      return;
    }

    const payload: UpdateProfileRequest = {
      fullName: fullName.trim(),
      bloodGroup,
      medicalNotes:
        medicalNotes.trim().length > 0 ? medicalNotes.trim() : null,
      isHelperAvailable,
    };

    updateProfileMutation.mutate(payload);
  };

  if (profileQuery.isLoading && !profile) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Edit Profile"
          subtitle="Loading account"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
        />

        <LoadingState
          title="Loading profile"
          message="Getting your account details..."
          fullScreen
        />
      </Screen>
    );
  }

  if (profileQuery.isError && !profile) {
    return (
      <Screen
        safeArea
        edges={['top', 'left', 'right']}
        contentContainerStyle={styles.screenContent}>
        <Header
          title="Edit Profile"
          subtitle="Unable to load"
          borderBottom
          leftAction={{
            accessibilityLabel: 'Go back',
            icon: <ArrowLeft color={colors.onSurface} size={22} />,
            onPress: navigation.goBack,
          }}
          rightAction={{
            accessibilityLabel: 'Retry profile',
            icon: <RefreshCcw color={colors.onSurface} size={22} />,
            onPress: () => {
              void profileQuery.refetch();
            },
          }}
        />

        <ErrorState
          title="Profile unavailable"
          message="Your profile could not be loaded right now."
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
      keyboardAvoiding
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Edit Profile"
        subtitle="Update account and helper settings"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
        rightAction={{
          accessibilityLabel: 'Refresh profile',
          disabled: profileQuery.isRefetching,
          icon: (
            <RefreshCcw
              color={
                profileQuery.isRefetching ? colors.onDisabled : colors.onSurface
              }
              size={22}
            />
          ),
          onPress: handleRefresh,
        }}
      />

      <View style={styles.content}>
        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Basic Information
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              error={fullNameError}
              maxLength={VALIDATION_LIMITS.FULL_NAME_MAX}
              leftIcon={<User color={colors.onSurfaceVariant} size={20} />}
            />
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <HeartPulse color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Medical Information
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.sectionDescription}>
            This information can help responders understand important medical
            details during emergencies.
          </Text>

          <Text
            variant="labelMedium"
            color="onSurface"
            style={styles.fieldLabel}>
            Blood Group
          </Text>

          <View style={styles.bloodGroupGrid}>
            {bloodGroupOptions.map(option => {
              const selected = bloodGroup === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Select blood group ${option}`}
                  onPress={() => setBloodGroup(selected ? null : option)}
                  style={[
                    styles.bloodGroupItem,
                    selected && styles.bloodGroupSelected,
                  ]}>
                  <Text
                    variant="labelMedium"
                    color={selected ? 'onPrimary' : 'onSurface'}
                    align="center">
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            label="Medical Notes"
            placeholder="Example: Allergic to penicillin, diabetic, asthma..."
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            error={medicalNotesError}
            hint="Optional"
            multiline
            textAlignVertical="top"
            maxLength={VALIDATION_LIMITS.MEDICAL_NOTES_MAX}
            inputStyle={styles.textArea}
          />
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ShieldCheck color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Helper Availability
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.sectionDescription}>
            When enabled, you may appear as an available helper for nearby SOS
            alerts.
          </Text>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{checked: isHelperAvailable}}
            onPress={() => setIsHelperAvailable(value => !value)}
            style={[
              styles.helperToggle,
              isHelperAvailable && styles.helperToggleActive,
            ]}>
            <View
              style={[
                styles.helperToggleIcon,
                isHelperAvailable && styles.helperToggleIconActive,
              ]}>
              {isHelperAvailable ? (
                <Check color={colors.onPrimary} size={20} />
              ) : null}
            </View>

            <View style={styles.helperToggleText}>
              <Text
                variant="labelLarge"
                color={isHelperAvailable ? 'onErrorContainer' : 'onSurface'}>
                {isHelperAvailable ? 'Helper Available' : 'Helper Unavailable'}
              </Text>

              <Text
                variant="bodySmall"
                color={
                  isHelperAvailable ? 'onErrorContainer' : 'onSurfaceVariant'
                }
                style={styles.helperToggleDescription}>
                {isHelperAvailable
                  ? 'You can receive nearby emergency opportunities.'
                  : 'You will not be shown as available helper.'}
              </Text>
            </View>

            <StatusBadge
              label={isHelperAvailable ? 'ON' : 'OFF'}
              tone={isHelperAvailable ? 'success' : 'neutral'}
              size="sm"
            />
          </Pressable>
        </Card>

        <Button
          title="Save Profile"
          fullWidth
          size="lg"
          loading={updateProfileMutation.isPending}
          disabled={!canSave || updateProfileMutation.isPending}
          leftIcon={
            <Save
              color={canSave ? colors.onPrimary : colors.onDisabled}
              size={20}
            />
          }
          onPress={handleSave}
          style={styles.saveButton}
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
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionDescription: {
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  fieldLabel: {
    marginTop: spacing.lg,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  bloodGroupItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 66,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bloodGroupSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  textArea: {
    minHeight: 118,
  },
  helperToggle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  helperToggleActive: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.primary,
  },
  helperToggleIcon: {
    alignItems: 'center',
    backgroundColor: colors.outline,
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  helperToggleIconActive: {
    backgroundColor: colors.primary,
  },
  helperToggleText: {
    flex: 1,
  },
  helperToggleDescription: {
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});