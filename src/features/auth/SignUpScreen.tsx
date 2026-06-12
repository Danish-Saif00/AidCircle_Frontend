import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';
import {CommonActions} from '@react-navigation/native';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react-native';

import type {AuthScreenProps} from '../../navigation/navigation.types';
import {authApi} from '../../services/api';
import {Button, Card, Screen, Text, TextInput} from '../../shared/components';
import {getApiErrorMessage} from '../../shared/utils/apiError';
import {colors, radius, shadows, spacing} from '../../shared/theme';
import {useAppStore, useAuthStore} from '../../store';
import {signUpSchema, type SignUpFormValues} from './auth.schema';

type SignUpScreenProps = AuthScreenProps<'SignUp'>;

export const SignUpScreen = ({navigation}: SignUpScreenProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const setSession = useAuthStore(state => state.setSession);

  const {
    control,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
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

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const response = await authApi.signup({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        phone: values.phone.trim().length > 0 ? values.phone.trim() : undefined,
      });

      await setSession(response);
      navigateToApp();
    } catch (error) {
      Alert.alert('Signup failed', getApiErrorMessage(error));
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
          Create Account
        </Text>

        <Text
          variant="bodyMedium"
          color="onSurfaceVariant"
          align="center"
          style={styles.subtitle}>
          Join AidCircle to create emergency alerts and help people around you.
        </Text>
      </View>

      <Card variant="elevated" style={styles.formCard}>
        <Controller
          control={control}
          name="fullName"
          render={({field: {value, onChange, onBlur}}) => (
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
              leftIcon={<User color={colors.onSurfaceVariant} size={20} />}
            />
          )}
        />

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
          name="phone"
          render={({field: {value, onChange, onBlur}}) => (
            <TextInput
              label="Phone"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
              hint="Optional"
              leftIcon={<Phone color={colors.onSurfaceVariant} size={20} />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({field: {value, onChange, onBlur}}) => (
            <TextInput
              label="Password"
              placeholder="Create a password"
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

        <Controller
          control={control}
          name="confirmPassword"
          render={({field: {value, onChange, onBlur}}) => (
            <TextInput
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<Lock color={colors.onSurfaceVariant} size={20} />}
              rightIcon={
                showConfirmPassword ? (
                  <EyeOff color={colors.onSurfaceVariant} size={20} />
                ) : (
                  <Eye color={colors.onSurfaceVariant} size={20} />
                )
              }
              onRightIconPress={() =>
                setShowConfirmPassword(current => !current)
              }
            />
          )}
        />

        <Button
          title="Create Account"
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
          Already have an account?
        </Text>

        <Button
          title="Log In"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
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
  loginButton: {
    marginTop: spacing.xs,
  },
});