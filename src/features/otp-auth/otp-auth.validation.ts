import { z } from 'zod';

// Request OTP validation schema
export const otpRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Verify OTP validation schema
export const otpVerifySchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z
    .string()
    .regex(/^[0-9]{6}$/, 'OTP code must be exactly 6 numeric digits'),
});

// OTP status validation schema (for query parameters)
export const otpStatusSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Type definitions
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type OtpStatusInput = z.infer<typeof otpStatusSchema>;