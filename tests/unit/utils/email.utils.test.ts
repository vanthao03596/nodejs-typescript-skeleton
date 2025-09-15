import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import { EmailProvider, MockEmailProvider, MailgunProvider, createEmailProvider } from '../../../src/utils/email.utils';
import { emailConfig } from '../../../src/config/email';

// Mock dependencies
vi.mock('../../../src/config/email', () => ({
  emailConfig: {
    mailgun: {
      apiKey: 'test-api-key',
      domain: 'test.mailgun.com',
    },
    from: 'test@example.com',
    isDevelopment: true,
  },
}));

// Create mock functions that can be accessed in tests
const mockCreate = vi.fn();
const mockClient = vi.fn(() => ({
  messages: {
    create: mockCreate,
  },
}));

vi.mock('mailgun.js', () => ({
  default: vi.fn(() => ({
    client: mockClient,
  })),
}));

vi.mock('form-data', () => ({
  default: {},
}));

describe('Email Utils', () => {
  let consoleSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('EmailProvider Interface', () => {
    it('should define the correct interface structure', () => {
      const provider: EmailProvider = new MockEmailProvider();
      expect(typeof provider.send).toBe('function');
      expect(provider.send.length).toBe(3); // to, subject, body parameters
    });
  });

  describe('MockEmailProvider', () => {
    let mockProvider: MockEmailProvider;

    beforeEach(() => {
      mockProvider = new MockEmailProvider();
    });

    it('should implement EmailProvider interface', () => {
      expect(mockProvider).toBeInstanceOf(MockEmailProvider);
      expect(typeof mockProvider.send).toBe('function');
    });

    it('should log email details when send is called', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const body = 'Test email body content';

      await mockProvider.send(to, subject, body);

      expect(consoleSpy).toHaveBeenCalledWith('\n📧 Mock Email Provider - Email would be sent:');
      expect(consoleSpy).toHaveBeenCalledWith(`To: ${to}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Subject: ${subject}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Body: ${body}`);
      expect(consoleSpy).toHaveBeenCalledWith('────────────────────────────────────────\n');
    });

    it('should complete successfully without throwing errors', async () => {
      await expect(
        mockProvider.send('test@example.com', 'Subject', 'Body')
      ).resolves.toBeUndefined();
    });

    it('should handle empty parameters gracefully', async () => {
      await expect(
        mockProvider.send('', '', '')
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith('To: ');
      expect(consoleSpy).toHaveBeenCalledWith('Subject: ');
      expect(consoleSpy).toHaveBeenCalledWith('Body: ');
    });

    it('should handle special characters in email content', async () => {
      const specialTo = 'user+test@example.com';
      const specialSubject = 'Test: ñoño & "quotes" <html>';
      const specialBody = 'Body with émojis 🚀 and\nnewlines';

      await mockProvider.send(specialTo, specialSubject, specialBody);

      expect(consoleSpy).toHaveBeenCalledWith(`To: ${specialTo}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Subject: ${specialSubject}`);
      expect(consoleSpy).toHaveBeenCalledWith(`Body: ${specialBody}`);
    });
  });

  describe('MailgunProvider', () => {
    beforeEach(() => {
      // Reset mocks before each test
      vi.mocked(emailConfig).mailgun.apiKey = 'test-api-key';
      vi.mocked(emailConfig).mailgun.domain = 'test.mailgun.com';
    });

    describe('constructor', () => {
      it('should create MailgunProvider when API key and domain are provided', () => {
        expect(() => new MailgunProvider()).not.toThrow();
      });

      it('should throw error when API key is missing', () => {
        vi.mocked(emailConfig).mailgun.apiKey = undefined;

        expect(() => new MailgunProvider()).toThrow(
          'Mailgun API key and domain are required for production'
        );
      });

      it('should throw error when domain is missing', () => {
        vi.mocked(emailConfig).mailgun.domain = undefined;

        expect(() => new MailgunProvider()).toThrow(
          'Mailgun API key and domain are required for production'
        );
      });

      it('should throw error when both API key and domain are missing', () => {
        vi.mocked(emailConfig).mailgun.apiKey = undefined;
        vi.mocked(emailConfig).mailgun.domain = undefined;

        expect(() => new MailgunProvider()).toThrow(
          'Mailgun API key and domain are required for production'
        );
      });

      it('should throw error when API key is empty string', () => {
        vi.mocked(emailConfig).mailgun.apiKey = '';

        expect(() => new MailgunProvider()).toThrow(
          'Mailgun API key and domain are required for production'
        );
      });

      it('should throw error when domain is empty string', () => {
        vi.mocked(emailConfig).mailgun.domain = '';

        expect(() => new MailgunProvider()).toThrow(
          'Mailgun API key and domain are required for production'
        );
      });
    });

    describe('send method', () => {
      let mailgunProvider: MailgunProvider;

      beforeEach(() => {
        vi.clearAllMocks();
        mailgunProvider = new MailgunProvider();
      });

      it('should send email successfully', async () => {
        mockCreate.mockResolvedValue({ id: 'test-message-id' });

        const to = 'recipient@example.com';
        const subject = 'Test Subject';
        const body = 'Test email body';

        await mailgunProvider.send(to, subject, body);

        expect(mockCreate).toHaveBeenCalledWith('test.mailgun.com', {
          from: 'test@example.com',
          to: [to],
          subject,
          text: body,
        });
      });

      it('should handle Mailgun API errors and throw formatted error', async () => {
        const originalError = new Error('Mailgun API error');
        mockCreate.mockRejectedValue(originalError);

        await expect(
          mailgunProvider.send('test@example.com', 'Subject', 'Body')
        ).rejects.toThrow('Failed to send email: Mailgun API error');
      });

      it('should handle non-Error objects and throw generic error', async () => {
        mockCreate.mockRejectedValue('String error');

        await expect(
          mailgunProvider.send('test@example.com', 'Subject', 'Body')
        ).rejects.toThrow('Failed to send email: Unknown error');
      });

      it('should handle null/undefined errors', async () => {
        mockCreate.mockRejectedValue(null);

        await expect(
          mailgunProvider.send('test@example.com', 'Subject', 'Body')
        ).rejects.toThrow('Failed to send email: Unknown error');
      });

      it('should send email with correct parameters for multiple recipients', async () => {
        mockCreate.mockResolvedValue({ id: 'test-message-id' });

        await mailgunProvider.send('user@example.com', 'Multi-recipient Test', 'Body content');

        expect(mockCreate).toHaveBeenCalledWith('test.mailgun.com', {
          from: 'test@example.com',
          to: ['user@example.com'],
          subject: 'Multi-recipient Test',
          text: 'Body content',
        });
      });

      it('should handle special characters in email content', async () => {
        mockCreate.mockResolvedValue({ id: 'test-message-id' });

        const specialSubject = 'Special chars: àáâã & "quotes" <html>';
        const specialBody = 'Body with émojis 🚀\nand newlines';

        await mailgunProvider.send('test@example.com', specialSubject, specialBody);

        expect(mockCreate).toHaveBeenCalledWith('test.mailgun.com', {
          from: 'test@example.com',
          to: ['test@example.com'],
          subject: specialSubject,
          text: specialBody,
        });
      });
    });
  });

  describe('createEmailProvider Factory', () => {
    beforeEach(() => {
      // Ensure valid config for MailgunProvider creation
      vi.mocked(emailConfig).mailgun.apiKey = 'test-api-key';
      vi.mocked(emailConfig).mailgun.domain = 'test.mailgun.com';
    });

    it('should return MockEmailProvider when isDevelopment is true', () => {
      vi.mocked(emailConfig).isDevelopment = true;

      const provider = createEmailProvider();

      expect(provider).toBeInstanceOf(MockEmailProvider);
    });

    it('should return MailgunProvider when isDevelopment is false', () => {
      vi.mocked(emailConfig).isDevelopment = false;

      const provider = createEmailProvider();

      expect(provider).toBeInstanceOf(MailgunProvider);
    });

    it('should always return an object that implements EmailProvider interface', () => {
      // Test development case
      vi.mocked(emailConfig).isDevelopment = true;
      let provider = createEmailProvider();
      expect(typeof provider.send).toBe('function');

      // Test production case
      vi.mocked(emailConfig).isDevelopment = false;
      provider = createEmailProvider();
      expect(typeof provider.send).toBe('function');
    });

    it('should create new instances on each call', () => {
      vi.mocked(emailConfig).isDevelopment = true;

      const provider1 = createEmailProvider();
      const provider2 = createEmailProvider();

      expect(provider1).not.toBe(provider2);
      expect(provider1).toBeInstanceOf(MockEmailProvider);
      expect(provider2).toBeInstanceOf(MockEmailProvider);
    });

    it('should throw error when trying to create MailgunProvider without valid config', () => {
      vi.mocked(emailConfig).isDevelopment = false;
      vi.mocked(emailConfig).mailgun.apiKey = undefined;

      expect(() => createEmailProvider()).toThrow(
        'Mailgun API key and domain are required for production'
      );
    });

    it('should handle environment switching correctly', () => {
      // Start in development
      vi.mocked(emailConfig).isDevelopment = true;
      let provider = createEmailProvider();
      expect(provider).toBeInstanceOf(MockEmailProvider);

      // Switch to production
      vi.mocked(emailConfig).isDevelopment = false;
      provider = createEmailProvider();
      expect(provider).toBeInstanceOf(MailgunProvider);

      // Switch back to development
      vi.mocked(emailConfig).isDevelopment = true;
      provider = createEmailProvider();
      expect(provider).toBeInstanceOf(MockEmailProvider);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end in development mode', async () => {
      vi.mocked(emailConfig).isDevelopment = true;

      const provider = createEmailProvider();

      await expect(
        provider.send('test@example.com', 'Integration Test', 'Test body')
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith('\n📧 Mock Email Provider - Email would be sent:');
    });

    it('should work end-to-end in production mode with valid config', async () => {
      vi.mocked(emailConfig).isDevelopment = false;

      mockCreate.mockResolvedValue({ id: 'test-id' });

      const provider = createEmailProvider();

      await expect(
        provider.send('test@example.com', 'Production Test', 'Test body')
      ).resolves.toBeUndefined();

      expect(mockCreate).toHaveBeenCalledWith('test.mailgun.com', {
        from: 'test@example.com',
        to: ['test@example.com'],
        subject: 'Production Test',
        text: 'Test body',
      });
    });
  });
});