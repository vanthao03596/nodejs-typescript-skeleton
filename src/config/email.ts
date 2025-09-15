import { env } from './env';

export const emailConfig = {
  mailgun: {
    apiKey: env.MAILGUN_API_KEY,
    domain: env.MAILGUN_DOMAIN,
  },
  from: env.EMAIL_FROM,
  isDevelopment: env.NODE_ENV === 'development',
};