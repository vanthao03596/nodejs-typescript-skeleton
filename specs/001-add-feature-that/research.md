# Research: OTP Email Login Implementation

## Mailgun.js Integration

**Decision**: Use official Mailgun.js SDK with TypeScript support
**Rationale**:
- Official SDK provides type safety and maintained compatibility
- Built-in retry logic and error handling
- Supports both production and sandbox environments
- Async/await pattern aligns with existing codebase

**Alternatives considered**:
- Nodemailer with Mailgun SMTP: More generic but requires manual configuration
- Direct API calls: More control but reinventing the wheel
- SendGrid: Similar features but Mailgun specified in requirements

**Implementation Pattern**:
```typescript
// Config pattern for environment-based switching
const mailgunConfig = {
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
  testMode: process.env.NODE_ENV === 'development'
}
```

## Mock Email Provider for Development

**Decision**: Create in-memory email provider with console logging
**Rationale**:
- Zero external dependencies for development
- Instant feedback during development
- Can be extended to write to file for testing
- Matches existing mock patterns in codebase

**Alternatives considered**:
- Mailhog: Requires additional service setup
- Ethereal Email: Requires internet connection
- File-based storage: More complex than needed

**Implementation Pattern**:
```typescript
interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>
}

// Factory pattern for provider selection
const createEmailProvider = (): EmailProvider => {
  return process.env.NODE_ENV === 'production'
    ? new MailgunProvider()
    : new MockEmailProvider()
}
```

## OTP Generation and Security

**Decision**: Cryptographically secure 6-digit numeric codes
**Rationale**:
- 6 digits provides 1 million combinations (sufficient with rate limiting)
- Numeric-only improves user experience (easy to type)
- crypto.randomInt() ensures cryptographic security
- Matches industry standards (Google, Microsoft, banks)

**Alternatives considered**:
- Alphanumeric codes: Harder to type, minimal security gain
- 8-digit codes: Unnecessary with proper rate limiting
- UUID tokens: Too long for manual entry

**Security Measures**:
- Single use enforcement
- Time-based expiration (10 minutes)
- Failed attempt tracking (max 5)
- Rate limiting (3 requests per 15 minutes)

## OTP Storage with Prisma

**Decision**: Dedicated OtpRequest model with automatic expiration
**Rationale**:
- Separate table maintains single responsibility
- Prisma's DateTime type handles timezone correctly
- Indexed email field for fast lookups
- Soft delete pattern via 'used' flag

**Alternatives considered**:
- Redis with TTL: Adds complexity, already using MySQL
- In-memory storage: Not suitable for distributed systems
- User table columns: Violates single responsibility

**Schema Design**:
```prisma
model OtpRequest {
  id         Int      @id @default(autoincrement())
  email      String   @db.VarChar(255)
  code       String   @db.VarChar(6)
  expiresAt  DateTime
  attempts   Int      @default(0)
  used       Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([email])
  @@index([code, email])
  @@map("otp_requests")
}
```

## Redis Rate Limiting Integration

**Decision**: Extend existing rateLimiter middleware with custom key strategy
**Rationale**:
- Leverages existing Redis connection and middleware
- Consistent with current rate limiting approach
- Custom key allows email-based limiting
- No new dependencies required

**Alternatives considered**:
- express-rate-limit with Redis store: Redundant with existing middleware
- Database-based counting: Slower, adds DB load
- IP-based limiting only: Doesn't prevent email flooding

**Implementation Pattern**:
```typescript
// Custom key generator for OTP endpoints
const otpRateLimiter = createRateLimiter({
  keyGenerator: (req) => `otp:${req.body.email}`,
  max: 3,
  windowMs: 15 * 60 * 1000 // 15 minutes
})
```

## Session Management After OTP Verification

**Decision**: Reuse existing JWT session with extended expiration
**Rationale**:
- Consistent with current auth system
- No new session storage required
- JWT contains user claims for stateless auth
- 7-day expiration aligns with requirements

**Alternatives considered**:
- Separate OTP session tokens: Adds complexity
- Database sessions: Requires new infrastructure
- Cookie-based sessions: Not suitable for API

**Integration Pattern**:
- OTP verification returns same JWT as password login
- User creation happens within OTP verification transaction
- Existing auth middleware validates sessions

## Key Technical Decisions Summary

1. **Email**: Mailgun.js for production, mock provider for development
2. **OTP Format**: 6-digit numeric codes via crypto.randomInt()
3. **Storage**: MySQL via Prisma with dedicated OtpRequest model
4. **Rate Limiting**: Redis with email-based keys (3 per 15 min)
5. **Sessions**: Existing JWT pattern with 7-day expiration
6. **Testing**: Mock provider enables full integration testing

All decisions align with constitutional principles:
- KISS: Reusing existing patterns and infrastructure
- YAGNI: No premature optimization or unused features
- Feature-First: Self-contained in otp-auth feature module
- Test-First: All components designed for testability