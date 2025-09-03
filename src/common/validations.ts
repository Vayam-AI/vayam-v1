import { z } from "zod";

// Phone number validation schema
export const phoneSchema = z.object({
  mobile: z.string()
    .min(10, "Phone number too short")
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format (e.g., +919876543210)"),
});

// OTP verification schema
export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Verify OTP schema (includes all required fields)
export const verifyOtpSchema = z.object({
  verificationSid: z.string().min(1, "Verification SID is required"),
  otp: z.string().length(6, "OTP must be 6 digits")
});

// Type exports
export type UpdatePhoneFormData = z.infer<typeof phoneSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;