import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { emailConfig } from '../config/email';

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class MockEmailProvider implements EmailProvider {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log('\n📧 Mock Email Provider - Email would be sent:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('────────────────────────────────────────\n');
  }
}

export class MailgunProvider implements EmailProvider {
  private mailgun: Mailgun;
  private mg: ReturnType<Mailgun['client']>;

  constructor() {
    if (!emailConfig.mailgun.apiKey || !emailConfig.mailgun.domain) {
      throw new Error('Mailgun API key and domain are required for production');
    }

    this.mailgun = new Mailgun(formData);
    this.mg = this.mailgun.client({
      username: 'api',
      key: emailConfig.mailgun.apiKey!,
    });
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    try {
      await this.mg.messages.create(emailConfig.mailgun.domain!, {
        from: emailConfig.from,
        to: [to],
        subject,
        text: body,
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createEmailProvider = (): EmailProvider => {
  return emailConfig.isDevelopment
    ? new MockEmailProvider()
    : new MailgunProvider();
};

export const sendOtpEmail = async (email: string, otpCode: string): Promise<void> => {
  const emailProvider = createEmailProvider();
  const subject = 'Your OTP Code';
  const body = `Your OTP code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

  await emailProvider.send(email, subject, body);
};