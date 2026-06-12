import {z} from 'zod';

import {VALIDATION_LIMITS} from '../../config/constants';

const phoneRegex = /^\+?[0-9\s\-()]{7,30}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(
        VALIDATION_LIMITS.FULL_NAME_MIN,
        `Full name must be at least ${VALIDATION_LIMITS.FULL_NAME_MIN} characters.`,
      )
      .max(
        VALIDATION_LIMITS.FULL_NAME_MAX,
        `Full name must be less than ${VALIDATION_LIMITS.FULL_NAME_MAX} characters.`,
      ),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required.')
      .email('Enter a valid email address.'),
    phone: z
      .string()
      .trim()
      .refine(value => value.length === 0 || phoneRegex.test(value), {
        message: 'Enter a valid phone number.',
      }),
    password: z
      .string()
      .min(
        VALIDATION_LIMITS.PASSWORD_MIN,
        `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters.`,
      ),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;