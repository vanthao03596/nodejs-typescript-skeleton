# Data Model: OTP Email Login

## Entity Definitions

### OtpRequest
Represents a single OTP login attempt with tracking for security and validation.

**Fields**:
- `id` (Int): Primary key, auto-increment
- `email` (String): Email address requesting OTP (indexed)
- `code` (String): 6-digit numeric OTP code
- `expires_at` (DateTime): Timestamp when OTP becomes invalid
- `attempts` (Int): Number of failed verification attempts (default: 0)
- `used` (Boolean): Whether OTP has been successfully used (default: false)
- `created_at` (DateTime): Timestamp of OTP creation

**Validation Rules**:
- Email must be valid format (RFC 5322)
- Code must be exactly 6 numeric digits
- Expires_at must be future timestamp at creation
- Attempts must be 0-5 (max 5 attempts)
- Used OTPs cannot be reused

**State Transitions**:
```
Created (attempts=0, used=false)
  ↓
Attempted (attempts++, used=false) [up to 5 times]
  ↓
Success (used=true) OR Expired (expires_at < now) OR Blocked (attempts=5)
```

### User (Modified)
Existing User entity with OTP-related additions.

**New Fields**:
- `created_via` (String): Registration method ('password' | 'otp')
- `last_otp_at` (DateTime?): Timestamp of last OTP request

**Relationships**:
- User can have many OtpRequests (via email, not FK for flexibility)

### Session (Existing)
Uses existing JWT session management, no database model required.

## Prisma Schema

```prisma
model OtpRequest {
  id        Int      @id @default(autoincrement())
  email     String   @db.VarChar(255)
  code      String   @db.VarChar(6)
  expiresAt DateTime @map("expires_at")
  attempts  Int      @default(0)
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([email])
  @@index([code, email])
  @@map("otp_requests")
}

model User {
  id          Int       @id @default(autoincrement())
  email       String    @unique @db.VarChar(255)
  password    String?   @db.VarChar(255) // Nullable for OTP-only users
  name        String?   @db.VarChar(255)
  createdVia  String    @default("password") @map("created_via") @db.VarChar(20)
  lastOtpAt   DateTime? @map("last_otp_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

## Query Patterns

### Find Valid OTP
```typescript
const validOtp = await prisma.otpRequest.findFirst({
  where: {
    email: email.toLowerCase(),
    code,
    used: false,
    attempts: { lt: 5 },
    expiresAt: { gt: new Date() }
  }
})
```

### Count Recent Requests (Rate Limiting Check)
```typescript
const recentRequests = await prisma.otpRequest.count({
  where: {
    email: email.toLowerCase(),
    createdAt: {
      gte: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes
    }
  }
})
```

### Mark OTP as Used
```typescript
await prisma.otpRequest.update({
  where: { id: otpId },
  data: { used: true }
})
```

### Create or Find User
```typescript
const user = await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  update: { lastOtpAt: new Date() },
  create: {
    email: email.toLowerCase(),
    createdVia: 'otp',
    lastOtpAt: new Date()
  }
})
```

## Migration Strategy

### Up Migration
```sql
CREATE TABLE otp_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_code_email (code, email)
);

ALTER TABLE users
ADD COLUMN created_via VARCHAR(20) DEFAULT 'password',
ADD COLUMN last_otp_at DATETIME NULL;

ALTER TABLE users MODIFY password VARCHAR(255) NULL;
```

### Down Migration
```sql
DROP TABLE IF EXISTS otp_requests;

ALTER TABLE users
DROP COLUMN created_via,
DROP COLUMN last_otp_at;

ALTER TABLE users MODIFY password VARCHAR(255) NOT NULL;
```

## Data Retention Policy

- OTP requests older than 30 days: Deleted via cron job
- Failed OTP requests: Retained for security analysis
- User audit trail: Maintained indefinitely

## Performance Considerations

- Email index ensures O(log n) lookups
- Composite index on (code, email) for verification queries
- Partition by created_at if table exceeds 1M rows
- Consider archiving old records to separate table