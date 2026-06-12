import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';
import {CommonActions} from '@react-navigation/native';
import {ArrowRight, Eye, EyeOff, Lock, Mail} from 'lucide-react-native';

import type {AuthScreenProps} from '../../navigation/navigation.types';
import {authApi} from '../../services/api';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {Button, Card, Screen, Text, TextInput} from '../../shared/components';
import {colors, radius, shadows, spacing} from '../../shared/theme';
import {useAppStore, useAuthStore} from '../../store';
import {loginSchema, type LoginFormValues} from './auth.schema';

type LoginScreenProps = AuthScreenProps<'Login'>;

export const LoginScreen = ({navigation}: LoginScreenProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const setSession = useAuthStore(state => state.setSession);

  const {
    control,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const navigateToApp = () => {
    const hasCompletedPermissionsSetup =
      useAppStore.getState().hasCompletedPermissionsSetup;

    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'App',
            params: hasCompletedPermissionsSetup
              ? {
                  screen: 'MainTabs',
                  params: {
                    screen: 'HomeTab',
                    params: {
                      screen: 'HomeMapSos',
                    },
                  },
                }
              : {
                  screen: 'PermissionsSetup',
                },
          },
        ],
      }),
    );
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await authApi.login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      await setSession(response);
      navigateToApp();
    } catch (error) {
      Alert.alert('Login failed', getApiErrorMessage(error));
    }
  };

  return (
    <Screen
      scrollable
      keyboardAvoiding
      safeArea
      contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text variant="headingSmall" color="onPrimary" weight="800">
            SOS
          </Text>
        </View>

        <Text
          variant="displaySmall"
          color="onSurface"
          align="center"
          style={styles.title}>
          Welcome Back
        </Text>

        <Text
          variant="bodyMedium"
          color="onSurfaceVariant"
          align="center"
          style={styles.subtitle}>
          Log in to create alerts, respond to nearby emergencies, and manage
          your AidCircle profile.
        </Text>
      </View>

      <Card variant="elevated" style={styles.formCard}>
        <Controller
          control={control}
          name="email"
          render={({field: {value, onChange, onBlur}}) => (
            <TextInput
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              leftIcon={<Mail color={colors.onSurfaceVariant} size={20} />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({field: {value, onChange, onBlur}}) => (
            <TextInput
              label="Password"
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock color={colors.onSurfaceVariant} size={20} />}
              rightIcon={
                showPassword ? (
                  <EyeOff color={colors.onSurfaceVariant} size={20} />
                ) : (
                  <Eye color={colors.onSurfaceVariant} size={20} />
                )
              }
              onRightIconPress={() => setShowPassword(current => !current)}
            />
          )}
        />

        <Button
          title="Log In"
          fullWidth
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          rightIcon={<ArrowRight color={colors.onPrimary} size={20} />}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitButton}
        />
      </Card>

      <View style={styles.footer}>
        <Text variant="bodyMedium" color="onSurfaceVariant" align="center">
          New to AidCircle?
        </Text>

        <Button
          title="Create Account"
          variant="ghost"
          onPress={() => navigation.navigate('SignUp')}
          style={styles.createAccountButton}
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
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 82,
    justifyContent: 'center',
    width: 82,
    ...shadows.sosButton,
  },
  title: {
    marginTop: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  formCard: {
    gap: spacing.lg,
    marginTop: spacing.xxxl,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  createAccountButton: {
    marginTop: spacing.xs,
  },
});