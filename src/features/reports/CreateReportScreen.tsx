import React, {useMemo, useState} from 'react';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FileWarning,
  MessageSquareWarning,
  Send,
  ShieldAlert,
  UserX,
} from 'lucide-react-native';

import type {AppScreenProps} from '../../navigation/navigation.types';
import {
  reportsApi,
  type CreateReportRequest,
} from '../../services/api';
import {
  Button,
  Card,
  Header,
  Screen,
  StatusBadge,
  Text,
  TextInput,
} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, spacing} from '../../shared/theme';

type CreateReportScreenProps = AppScreenProps<'CreateReport'>;

type ReportReasonOption = {
  label: string;
  value: string;
  description: string;
};

const REPORT_REASON_MIN = 3;
const REPORT_REASON_MAX = 120;
const REPORT_DESCRIPTION_MAX = 1000;

const emergencyReasons: ReportReasonOption[] = [
  {
    label: 'Fake SOS Alert',
    value: 'Fake SOS alert',
    description: 'The emergency appears fake, misleading, or intentionally false.',
  },
  {
    label: 'Wrong Information',
    value: 'Wrong emergency information',
    description: 'The location, title, or description appears incorrect.',
  },
  {
    label: 'Unsafe Content',
    value: 'Unsafe emergency content',
    description: 'The SOS contains abusive, harmful, or inappropriate content.',
  },
];

const userReasons: ReportReasonOption[] = [
  {
    label: 'Abusive User',
    value: 'Abusive user behavior',
    description: 'The user is harassing, threatening, or abusing others.',
  },
  {
    label: 'Suspicious Activity',
    value: 'Suspicious user activity',
    description: 'The user profile or behavior appears suspicious.',
  },
  {
    label: 'False Response',
    value: 'False or misleading response',
    description: 'The user accepted or interacted with emergencies dishonestly.',
  },
];

export const CreateReportScreen = ({
  navigation,
  route,
}: CreateReportScreenProps) => {
  const {targetType, targetId, contextTitle} = route.params;

  const queryClient = useQueryClient();

  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');

  const reasonOptions =
    targetType === 'emergency' ? emergencyReasons : userReasons;

  const finalReason = selectedReason === 'custom' ? customReason : selectedReason;

  const reasonError = useMemo(() => {
    const value = finalReason.trim();

    if (!value) {
      return undefined;
    }

    if (value.length < REPORT_REASON_MIN) {
      return `Reason must be at least ${REPORT_REASON_MIN} characters.`;
    }

    if (value.length > REPORT_REASON_MAX) {
      return `Reason must be less than ${REPORT_REASON_MAX} characters.`;
    }

    return undefined;
  }, [finalReason]);

  const descriptionError = useMemo(() => {
    const value = description.trim();

    if (value.length > REPORT_DESCRIPTION_MAX) {
      return `Description must be less than ${REPORT_DESCRIPTION_MAX} characters.`;
    }

    return undefined;
  }, [description]);

  const canSubmit =
    finalReason.trim().length >= REPORT_REASON_MIN &&
    finalReason.trim().length <= REPORT_REASON_MAX &&
    description.trim().length <= REPORT_DESCRIPTION_MAX;

  const createReportMutation = useMutation({
    mutationFn: (payload: CreateReportRequest) => {
      if (targetType === 'emergency') {
        return reportsApi.reportEmergency(targetId, payload);
      }

      return reportsApi.reportUser(targetId, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['reports', 'me'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['reports', 'admin'],
        }),
      ]);

      Alert.alert(
        'Report submitted',
        'Your report has been submitted for admin review.',
      );

      navigation.goBack();
    },
    onError: error => {
      Alert.alert(
        'Report failed',
        getApiErrorMessage(
          error,
          'Your report could not be submitted right now.',
        ),
      );
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) {
      Alert.alert(
        'Check report details',
        reasonError ||
          descriptionError ||
          'Please select or enter a valid report reason.',
      );
      return;
    }

    const payload: CreateReportRequest = {
      reason: finalReason.trim(),
      ...(description.trim().length > 0
        ? {description: description.trim()}
        : {}),
    };

    createReportMutation.mutate(payload);
  };

  return (
    <Screen
      safeArea
      scrollable
      keyboardAvoiding
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Create Report"
        subtitle={
          targetType === 'emergency'
            ? 'Report emergency issue'
            : 'Report user issue'
        }
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
      />

      <View style={styles.content}>
        <Card variant="danger" style={styles.warningCard}>
          <View style={styles.warningIconWrap}>
            {targetType === 'emergency' ? (
              <ShieldAlert color={colors.onErrorContainer} size={30} />
            ) : (
              <UserX color={colors.onErrorContainer} size={30} />
            )}
          </View>

          <Text
            variant="headingSmall"
            color="onErrorContainer"
            align="center"
            style={styles.warningTitle}>
            {targetType === 'emergency' ? 'Report Emergency' : 'Report User'}
          </Text>

          <Text
            variant="bodySmall"
            color="onErrorContainer"
            align="center"
            style={styles.warningText}>
            Reports are reviewed by admins. Submit only accurate and relevant
            information.
          </Text>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FileWarning color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Report Target
            </Text>
          </View>

          <View style={styles.targetBox}>
            <View style={styles.targetIconWrap}>
              {targetType === 'emergency' ? (
                <ShieldAlert color={colors.primary} size={24} />
              ) : (
                <UserX color={colors.primary} size={24} />
              )}
            </View>

            <View style={styles.targetContent}>
              <Text variant="labelLarge" color="onSurface">
                {contextTitle ||
                  (targetType === 'emergency'
                    ? 'Emergency Report'
                    : 'User Report')}
              </Text>

              <Text
                variant="bodySmall"
                color="onSurfaceVariant"
                numberOfLines={1}
                style={styles.targetId}>
                Target ID: {targetId}
              </Text>
            </View>

            <StatusBadge
              label={targetType}
              tone={targetType === 'emergency' ? 'danger' : 'warning'}
              size="sm"
            />
          </View>
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MessageSquareWarning color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Select Reason
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.sectionDescription}>
            Choose the closest reason for this report.
          </Text>

          <View style={styles.reasonList}>
            {reasonOptions.map(option => {
              const selected = selectedReason === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Select report reason ${option.label}`}
                  onPress={() => {
                    setSelectedReason(option.value);
                    setCustomReason('');
                  }}
                  style={[
                    styles.reasonCard,
                    selected && styles.reasonCardSelected,
                  ]}>
                  <View
                    style={[
                      styles.reasonCheck,
                      selected && styles.reasonCheckSelected,
                    ]}>
                    {selected ? <Check color={colors.onPrimary} size={18} /> : null}
                  </View>

                  <View style={styles.reasonContent}>
                    <Text
                      variant="labelLarge"
                      color={selected ? 'onErrorContainer' : 'onSurface'}>
                      {option.label}
                    </Text>

                    <Text
                      variant="bodySmall"
                      color={
                        selected ? 'onErrorContainer' : 'onSurfaceVariant'
                      }
                      style={styles.reasonDescription}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select custom report reason"
              onPress={() => setSelectedReason('custom')}
              style={[
                styles.reasonCard,
                selectedReason === 'custom' && styles.reasonCardSelected,
              ]}>
              <View
                style={[
                  styles.reasonCheck,
                  selectedReason === 'custom' && styles.reasonCheckSelected,
                ]}>
                {selectedReason === 'custom' ? (
                  <Check color={colors.onPrimary} size={18} />
                ) : null}
              </View>

              <View style={styles.reasonContent}>
                <Text
                  variant="labelLarge"
                  color={
                    selectedReason === 'custom'
                      ? 'onErrorContainer'
                      : 'onSurface'
                  }>
                  Other Reason
                </Text>

                <Text
                  variant="bodySmall"
                  color={
                    selectedReason === 'custom'
                      ? 'onErrorContainer'
                      : 'onSurfaceVariant'
                  }
                  style={styles.reasonDescription}>
                  Write a custom reason if none of the above options match.
                </Text>
              </View>
            </Pressable>
          </View>

          {selectedReason === 'custom' ? (
            <TextInput
              label="Custom Reason"
              placeholder="Enter report reason"
              value={customReason}
              onChangeText={setCustomReason}
              error={reasonError}
              maxLength={REPORT_REASON_MAX}
              leftIcon={<AlertTriangle color={colors.onSurfaceVariant} size={20} />}
            />
          ) : null}
        </Card>

        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MessageSquareWarning color={colors.primary} size={22} />

            <Text variant="labelLarge" color="onSurface">
              Additional Details
            </Text>
          </View>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.sectionDescription}>
            Add useful context for admins. This field is optional.
          </Text>

          <TextInput
            label="Description"
            placeholder="Explain what happened or why this should be reviewed"
            value={description}
            onChangeText={setDescription}
            error={descriptionError}
            hint="Optional"
            multiline
            textAlignVertical="top"
            maxLength={REPORT_DESCRIPTION_MAX}
            inputStyle={styles.textArea}
          />
        </Card>

        <Button
          title="Submit Report"
          fullWidth
          size="lg"
          variant="danger"
          loading={createReportMutation.isPending}
          disabled={!canSubmit || createReportMutation.isPending}
          leftIcon={
            <Send
              color={canSubmit ? colors.onDanger : colors.onDisabled}
              size={20}
            />
          }
          onPress={handleSubmit}
          style={styles.submitButton}
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
  warningCard: {
    alignItems: 'center',
  },
  warningIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  warningTitle: {
    marginTop: spacing.md,
  },
  warningText: {
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
  sectionDescription: {
    marginTop: spacing.sm,
  },
  targetBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  targetIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  targetContent: {
    flex: 1,
  },
  targetId: {
    marginTop: spacing.xs,
  },
  reasonList: {
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  reasonCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  reasonCardSelected: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.primary,
  },
  reasonCheck: {
    alignItems: 'center',
    backgroundColor: colors.outline,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  reasonCheckSelected: {
    backgroundColor: colors.primary,
  },
  reasonContent: {
    flex: 1,
  },
  reasonDescription: {
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxl,
  },
});