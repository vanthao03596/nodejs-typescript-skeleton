import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (_error) {
    return null;
  }
};