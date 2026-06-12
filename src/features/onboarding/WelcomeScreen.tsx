import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BellRing, MapPin, ShieldCheck} from 'lucide-react-native';

import type {AuthScreenProps} from '../../navigation/navigation.types';
import {Button, Card, Screen, Text} from '../../shared/components';
import {colors, radius, shadows, spacing} from '../../shared/theme';

type WelcomeScreenProps = AuthScreenProps<'Welcome'>;

type FeatureItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const FeatureItem = ({icon, title, description}: FeatureItemProps) => {
  return (
    <Card variant="outlined" style={styles.featureCard}>
      <View style={styles.featureIconWrap}>{icon}</View>

      <View style={styles.featureContent}>
        <Text variant="labelLarge" color="onSurface">
          {title}
        </Text>

        <Text
          variant="bodySmall"
          color="onSurfaceVariant"
          style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </Card>
  );
};

export const WelcomeScreen = ({navigation}: WelcomeScreenProps) => {
  return (
    <Screen
      scrollable
      safeArea
      contentContainerStyle={styles.screenContent}
      statusBarStyle="dark-content">
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text variant="displayMedium" color="onPrimary" weight="800">
            SOS
          </Text>
        </View>

        <Text
          variant="displaySmall"
          color="onSurface"
          align="center"
          style={styles.title}>
          AidCircle
        </Text>

        <Text
          variant="bodyLarge"
          color="onSurfaceVariant"
          align="center"
          style={styles.subtitle}>
          Create emergency alerts, notify nearby helpers, and respond faster
          when someone needs help.
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureItem
          icon={<ShieldCheck color={colors.primary} size={24} />}
          title="Emergency SOS"
          description="Create critical alerts with your live location and emergency details."
        />

        <FeatureItem
          icon={<MapPin color={colors.secondary} size={24} />}
          title="Nearby Helpers"
          description="Find available helpers and active emergencies around your area."
        />

        <FeatureItem
          icon={<BellRing color={colors.success} size={24} />}
          title="Push Alerts"
          description="Receive in-app and push notifications for nearby emergency activity."
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="Create Account"
          fullWidth
          size="lg"
          onPress={() => navigation.navigate('SignUp')}
        />

        <Button
          title="Log In"
          fullWidth
          size="lg"
          variant="outline"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
        />
      </View>

      <Text
        variant="caption"
        color="onSurfaceVariant"
        align="center"
        style={styles.footerNote}>
        Use AidCircle responsibly. Always contact official emergency services
        when immediate professional help is required.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 132,
    justifyContent: 'center',
    width: 132,
    ...shadows.sosButton,
  },
  title: {
    marginTop: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.md,
    maxWidth: 320,
  },
  features: {
    gap: spacing.md,
    marginTop: spacing.xxxl,
  },
  featureCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  featureIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  featureContent: {
    flex: 1,
  },
  featureDescription: {
    marginTop: spacing.xxs,
  },
  actions: {
    marginTop: spacing.xxxl,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  footerNote: {
    marginTop: spacing.xl,
  },
});