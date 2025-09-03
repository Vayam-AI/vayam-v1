import { z } from 'zod';

export const emailSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const otpVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const passwordSetupSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
});

export const emailSigninSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type EmailSignupData = z.infer<typeof emailSignupSchema>;
export type OTPVerificationData = z.infer<typeof otpVerificationSchema>;
export type PasswordSetupData = z.infer<typeof passwordSetupSchema>;
export type EmailSigninData = z.infer<typeof emailSigninSchema>;
