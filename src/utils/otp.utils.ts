import { randomInt } from 'crypto';

export const generateOtp = (): string => {
  const otp = randomInt(100000, 999999);
  return otp.toString();
};

export const isOtpExpired = (createdAt: Date, expiryMinutes: number = 10): boolean => {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
  return now > expiryTime;
};

export const validateOtpFormat = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};