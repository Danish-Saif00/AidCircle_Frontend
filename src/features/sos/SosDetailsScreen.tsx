import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {ArrowLeft, AlertTriangle, ChevronRight, FileText} from 'lucide-react-native';

import {
  EMERGENCY_PRIORITIES,
  type EmergencyPriority,
  VALIDATION_LIMITS,
} from '../../config/constants';
import type {AppScreenProps} from '../../navigation/navigation.types';
import {
  Button,
  Card,
  Header,
  PressableCard,
  Screen,
  StatusBadge,
  Text,
  TextInput,
} from '../../shared/components';
import {colors, radius, spacing} from '../../shared/theme';

type SosDetailsScreenProps = AppScreenProps<'SosDetails'>;

const priorityOptions: EmergencyPriority[] = [
  EMERGENCY_PRIORITIES.LOW,
  EMERGENCY_PRIORITIES.MEDIUM,
  EMERGENCY_PRIORITIES.HIGH,
  EMERGENCY_PRIORITIES.CRITICAL,
];

const getPriorityTone = (
  priority: EmergencyPriority,
): 'neutral' | 'warning' | 'danger' => {
  if (priority === EMERGENCY_PRIORITIES.CRITICAL || priority === EMERGENCY_PRIORITIES.HIGH) {
    return 'danger';
  }

  if (priority === EMERGENCY_PRIORITIES.MEDIUM) {
    return 'warning';
  }

  return 'neutral';
};

const formatPriorityLabel = (priority: EmergencyPriority): string => {
  return priority.replace('_', ' ').toUpperCase();
};

export const SosDetailsScreen = ({
  navigation,
  route,
}: SosDetailsScreenProps) => {
  const {categoryId, categoryName, defaultPriority} = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<EmergencyPriority>(
    defaultPriority ?? EMERGENCY_PRIORITIES.HIGH,
  );

  const titleError = useMemo(() => {
    const value = title.trim();

    if (!value) {
      return undefined;
    }

    if (value.length < VALIDATION_LIMITS.SOS_TITLE_MIN) {
      return `Title must be at least ${VALIDATION_LIMITS.SOS_TITLE_MIN} characters.`;
    }

    if (value.length > VALIDATION_LIMITS.SOS_TITLE_MAX) {
      return `Title must be less than ${VALIDATION_LIMITS.SOS_TITLE_MAX} characters.`;
    }

    return undefined;
  }, [title]);

  const descriptionError = useMemo(() => {
    const value = description.trim();

    if (value.length > VALIDATION_LIMITS.SOS_DESCRIPTION_MAX) {
      return `Description must be less than ${VALIDATION_LIMITS.SOS_DESCRIPTION_MAX} characters.`;
    }

    return undefined;
  }, [description]);

  const canContinue =
    title.trim().length >= VALIDATION_LIMITS.SOS_TITLE_MIN &&
    title.trim().length <= VALIDATION_LIMITS.SOS_TITLE_MAX &&
    description.trim().length <= VALIDATION_LIMITS.SOS_DESCRIPTION_MAX;

  const handleContinue = () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!canContinue) {
      Alert.alert(
        'Check SOS details',
        titleError ||
          descriptionError ||
          'Please enter valid emergency details before continuing.',
      );
      return;
    }

    navigation.navigate('ConfirmSos', {
      categoryId,
      categoryName,
      title: trimmedTitle,
      description:
        trimmedDescription.length > 0 ? trimmedDescription : undefined,
      priority,
    });
  };

  return (
    <Screen
      safeArea
      scrollable
      keyboardAvoiding
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="SOS Details"
        subtitle={categoryName}
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
      />

      <View style={styles.content}>
        <Card variant="danger" style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <View style={styles.warningIconWrap}>
              <AlertTriangle color={colors.onErrorContainer} size={24} />
            </View>

            <View style={styles.warningContent}>
              <Text variant="labelLarge" color="onErrorContainer">
                Emergency Alert
              </Text>

              <Text
                variant="bodySmall"
                color="onErrorContainer"
                style={styles.warningText}>
                Your location will be attached on the confirmation step and
                nearby helpers will be notified after you send the SOS.
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.categoryCard}>
          <View style={styles.categoryIconWrap}>
            <FileText color={colors.primary} size={24} />
          </View>

          <View style={styles.categoryContent}>
            <Text variant="labelLarge" color="onSurface">
              Selected Category
            </Text>

            <Text
              variant="bodyMedium"
              color="onSurfaceVariant"
              style={styles.categoryName}>
              {categoryName}
            </Text>
          </View>

          <StatusBadge
            label={formatPriorityLabel(priority)}
            tone={getPriorityTone(priority)}
            size="sm"
          />
        </Card>

        <View style={styles.form}>
          <TextInput
            label="Emergency Title"
            placeholder="Example: Need medical help"
            value={title}
            onChangeText={setTitle}
            error={titleError}
            maxLength={VALIDATION_LIMITS.SOS_TITLE_MAX}
            leftIcon={<AlertTriangle color={colors.onSurfaceVariant} size={20} />}
          />

          <TextInput
            label="Description"
            placeholder="Describe what happened and what kind of help is needed"
            value={description}
            onChangeText={setDescription}
            error={descriptionError}
            hint="Optional but recommended"
            multiline
            textAlignVertical="top"
            maxLength={VALIDATION_LIMITS.SOS_DESCRIPTION_MAX}
            inputStyle={styles.textArea}
          />
        </View>

        <View style={styles.prioritySection}>
          <Text variant="headingSmall" color="onSurface">
            Priority Level
          </Text>

          <Text
            variant="bodySmall"
            color="onSurfaceVariant"
            style={styles.priorityHint}>
            Choose how urgent this SOS is. Use critical only for immediate
            danger.
          </Text>

          <View style={styles.priorityGrid}>
            {priorityOptions.map(item => {
              const selected = item === priority;

              return (
                <PressableCard
                  key={item}
                  variant={selected ? 'danger' : 'outlined'}
                  onPress={() => setPriority(item)}
                  style={styles.priorityCard}>
                  <Text
                    variant="labelMedium"
                    color={selected ? 'onErrorContainer' : 'onSurface'}
                    align="center">
                    {formatPriorityLabel(item)}
                  </Text>

                  <StatusBadge
                    label={selected ? 'Selected' : 'Tap'}
                    tone={selected ? getPriorityTone(item) : 'neutral'}
                    size="sm"
                    style={styles.priorityBadge}
                  />
                </PressableCard>
              );
            })}
          </View>
        </View>

        <Button
          title="Continue to Confirmation"
          fullWidth
          size="lg"
          disabled={!canContinue}
          rightIcon={
            <ChevronRight
              color={canContinue ? colors.onPrimary : colors.onDisabled}
              size={22}
            />
          }
          onPress={handleContinue}
          style={styles.continueButton}
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
    marginBottom: spacing.lg,
  },
  warningHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  warningIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  warningContent: {
    flex: 1,
  },
  warningText: {
    marginTop: spacing.xs,
  },
  categoryCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  categoryIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    marginTop: spacing.xxs,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  textArea: {
    minHeight: 110,
  },
  prioritySection: {
    marginTop: spacing.xl,
  },
  priorityHint: {
    marginTop: spacing.xs,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  priorityCard: {
    alignItems: 'center',
    flexBasis: '47%',
  },
  priorityBadge: {
    marginTop: spacing.sm,
  },
  continueButton: {
    marginTop: spacing.xxxl,
  },
});