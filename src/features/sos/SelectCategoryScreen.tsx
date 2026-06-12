import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, AlertTriangle, ShieldAlert} from 'lucide-react-native';

import type {AppScreenProps} from '../../navigation/navigation.types';
import {emergenciesApi, type EmergencyCategory} from '../../services/api';
import {
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  PressableCard,
  Screen,
  StatusBadge,
  Text,
} from '../../shared/components';
import {colors, radius, spacing} from '../../shared/theme';

type SelectCategoryScreenProps = AppScreenProps<'SelectCategory'>;

const getPriorityTone = (
  priority: EmergencyCategory['priority'],
): 'neutral' | 'warning' | 'danger' => {
  if (priority === 'critical' || priority === 'high') {
    return 'danger';
  }

  if (priority === 'medium') {
    return 'warning';
  }

  return 'neutral';
};

export const SelectCategoryScreen = ({
  navigation,
}: SelectCategoryScreenProps) => {
  const categoriesQuery = useQuery({
    queryKey: ['emergencies', 'categories'],
    queryFn: emergenciesApi.getCategories,
  });

  const handleSelectCategory = (category: EmergencyCategory) => {
    navigation.navigate('SosDetails', {
      categoryId: category.id,
      categoryName: category.name,
      defaultPriority: category.priority,
    });
  };

  return (
    <Screen
      safeArea
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.screenContent}>
      <Header
        title="Select Emergency"
        subtitle="Choose the type of help you need"
        borderBottom
        leftAction={{
          accessibilityLabel: 'Go back',
          icon: <ArrowLeft color={colors.onSurface} size={22} />,
          onPress: navigation.goBack,
        }}
      />

      <View style={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <ShieldAlert color={colors.onPrimary} size={30} />
          </View>

          <View style={styles.heroContent}>
            <Text variant="headingSmall" color="onSurface">
              What is happening?
            </Text>

            <Text
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.heroDescription}>
              Select the closest emergency category. You can add details on the
              next screen before sending the SOS alert.
            </Text>
          </View>
        </View>

        {categoriesQuery.isLoading ? (
          <LoadingState
            title="Loading categories"
            message="Preparing emergency options..."
            fullScreen
          />
        ) : categoriesQuery.isError ? (
          <ErrorState
            title="Unable to load categories"
            message="Emergency categories could not be loaded right now."
            onRetry={() => {
              void categoriesQuery.refetch();
            }}
            fullScreen
          />
        ) : categoriesQuery.data?.length ? (
          <View style={styles.categoryList}>
            {categoriesQuery.data.map(category => (
              <PressableCard
                key={category.id}
                variant="outlined"
                onPress={() => handleSelectCategory(category)}
                style={styles.categoryCard}>
                <View style={styles.categoryIconWrap}>
                  <AlertTriangle
                    color={
                      category.priority === 'critical' ||
                      category.priority === 'high'
                        ? colors.primary
                        : colors.secondary
                    }
                    size={24}
                  />
                </View>

                <View style={styles.categoryContent}>
                  <View style={styles.categoryHeader}>
                    <Text variant="labelLarge" color="onSurface" numberOfLines={1}>
                      {category.name}
                    </Text>

                    <StatusBadge
                      label={category.priority}
                      tone={getPriorityTone(category.priority)}
                      size="sm"
                    />
                  </View>

                  <Text
                    variant="bodySmall"
                    color="onSurfaceVariant"
                    numberOfLines={2}
                    style={styles.categoryDescription}>
                    {category.description ||
                      'Send an emergency alert to available helpers nearby.'}
                  </Text>
                </View>
              </PressableCard>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No emergency categories"
            message="Emergency categories are not available yet."
            fullScreen
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.screenVertical,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.cardPadding,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  heroContent: {
    flex: 1,
  },
  heroDescription: {
    marginTop: spacing.xs,
  },
  categoryList: {
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  categoryDescription: {
    marginTop: spacing.xs,
  },
});