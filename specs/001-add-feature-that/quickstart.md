# OTP Email Login - Quick Start Guide

## Overview
This guide demonstrates the OTP email login feature, covering both new user registration and existing user authentication flows.

## Prerequisites
- Node.js 20.x installed
- MySQL database running
- Redis server running
- Environment variables configured (.env file)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create or update `.env` file:
```env
# Email Configuration
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.mailgun.org
EMAIL_FROM=noreply@yourdomain.com

# For development (uses mock provider)
NODE_ENV=development

# Existing configs
DATABASE_URL=mysql://user:password@localhost:3306/database
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
```

### 3. Run Database Migrations
```bash
npm run db:migrate
npm run db:generate
```

### 4. Start the Server
```bash
npm run dev
```

## Testing the Feature

### Scenario 1: New User Registration via OTP

#### Step 1: Request OTP for new email
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "email": "newuser@example.com",
    "expires_in": 600
  }
}
```

**Development Mode:** Check console for OTP code:
```
[MockEmail] OTP Code for newuser@example.com: 123456
```

#### Step 2: Verify OTP (creates new user)
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "code": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": {
      "id": 1,
      "email": "newuser@example.com",
      "name": null,
      "created_via": "otp",
      "created_at": "2025-01-15T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": "2025-01-22T10:00:00Z"
  }
}
```

### Scenario 2: Existing User Login via OTP

#### Step 1: Request OTP for existing user
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com"
  }'
```

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "code": "654321"
  }'
```

### Scenario 3: Error Cases

#### Invalid OTP Code
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "999999"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired OTP code",
  "error": {
    "code": "INVALID_OTP",
    "attempts_remaining": 4
  }
}
```

#### Rate Limit Exceeded
```bash
# Make 4 requests within 15 minutes
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/v1/auth/otp/request \
    -H "Content-Type: application/json" \
    -d '{"email": "ratelimit@example.com"}'
done
```

**Fourth request response:**
```json
{
  "success": false,
  "message": "Too many OTP requests. Please try again later.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "details": "Maximum 3 requests per 15 minutes"
  }
}
```

#### Expired OTP (after 10 minutes)
Wait 10+ minutes after requesting OTP, then try to verify.

### Scenario 4: Check OTP Status

```bash
curl -X GET "http://localhost:3000/api/v1/auth/otp/status?email=user@example.com"
```

**Response with active OTP:**
```json
{
  "success": true,
  "data": {
    "has_active_otp": true,
    "expires_in_seconds": 480,
    "attempts_used": 1,
    "can_request_new": false,
    "next_request_available_in": 720
  }
}
```

## Using the JWT Token

After successful OTP verification, use the returned JWT token for authenticated requests:

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Testing Checklist

- [ ] New user can request OTP
- [ ] New user can verify OTP and account is created
- [ ] Existing user can request OTP
- [ ] Existing user can verify OTP and receive JWT
- [ ] Invalid OTP code is rejected
- [ ] OTP expires after 10 minutes
- [ ] Maximum 5 failed attempts blocks OTP
- [ ] Rate limiting prevents more than 3 requests per 15 minutes
- [ ] Used OTP cannot be reused
- [ ] JWT token works for authenticated endpoints
- [ ] Session persists for 7 days

## Troubleshooting

### OTP Not Received
- **Development**: Check console output for mock email logs
- **Production**: Verify Mailgun configuration and domain verification

### Rate Limit Issues
- Wait 15 minutes or clear Redis key: `redis-cli DEL otp:user@example.com`

### Database Errors
- Ensure migrations are run: `npm run db:migrate`
- Check database connection in `.env`

## Production Considerations

1. **Email Delivery**: Ensure Mailgun domain is verified and configured
2. **Rate Limiting**: Adjust limits based on usage patterns
3. **Monitoring**: Set up alerts for:
   - Failed OTP deliveries
   - Unusual rate limit hits
   - Multiple failed verification attempts
4. **Security**: Regular cleanup of old OTP records (30-day retention)

## API Documentation

Full API documentation available at `/specs/001-add-feature-that/contracts/otp-auth-api.yaml`