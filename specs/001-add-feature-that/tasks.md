# Tasks: OTP Email Login

**Input**: Design documents from `/specs/001-add-feature-that/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/
**Task Count**: 29 tasks (5 optional) - Simplified from 34 following KISS/YAGNI principles
**Simplifications Applied**: See simplifications.md for audit details

## Quick Reference Guide

### Key Implementation Patterns
- **Email Provider Factory**: research.md:41-52 - Interface pattern with environment switching
- **OTP Generation**: research.md:57-73 - 6-digit using crypto.randomInt()
- **Rate Limiting**: research.md:119-128 - Email-based keys, 3 per 15 min
- **Prisma Schema**: data-model.md:48-75 - OtpRequest and User models
- **Query Patterns**: data-model.md:77-123 - Find valid OTP, count requests, mark used
- **API Contracts**: contracts/otp-auth-api.yaml - Request/response schemas for all endpoints
- **Test Scenarios**: quickstart.md:51-195 - New user, existing user, error cases, status check

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Features**: `src/features/[feature-name]/` structure
- **Tests**: `tests/unit/` and `tests/integration/` directories
- **Validation**: `[feature].validation.ts` with Zod schemas
- **Controllers**: `[feature].controller.ts` for request handling
- **Services**: `[feature].service.ts` for business logic

## Phase 3.1: Setup ✅ COMPLETED
- [x] T001 Install Mailgun.js dependency (npm install mailgun.js) - See research.md:7-25 for Mailgun.js decision
- [x] T002 [P] Create email configuration in src/config/email.ts - Include all env vars from quickstart.md:20-35
- [x] T003 [P] Create OTP utilities in src/utils/otp.utils.ts - See research.md:57-73 for OTP generation specs
- [x] T004 [P] Create email utilities with provider factory in src/utils/email.utils.ts - See research.md:41-52 for factory pattern
- [x] T005 Update .env.example with Mailgun and OTP configuration variables - See quickstart.md:20-35 for env vars

## Phase 3.2: Tests First (TDD) ✅ COMPLETED
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T006 [P] Contract test POST /api/v1/auth/otp/request in tests/integration/features/otp-auth/request.test.ts - See contracts/otp-auth-api.yaml:8-59
- [x] T007 [P] Contract test POST /api/v1/auth/otp/verify in tests/integration/features/otp-auth/verify.test.ts - See contracts/otp-auth-api.yaml:61-136
- [x] T008 [P] Contract test GET /api/v1/auth/otp/status in tests/integration/features/otp-auth/status.test.ts - See contracts/otp-auth-api.yaml:138-190
- [x] T009 [P] Integration test new user OTP registration flow in tests/integration/features/otp-auth/new-user-flow.test.ts - See quickstart.md:51-105
- [x] T010 [P] Integration test existing user OTP login flow in tests/integration/features/otp-auth/existing-user-flow.test.ts - See quickstart.md:107-127
- [x] T011 [P] Integration test rate limiting (3 per 15 min) in tests/integration/features/otp-auth/rate-limiting.test.ts - See quickstart.md:152-173
- [x] T012 [P] Unit test OTP generation and validation in tests/unit/utils/otp.utils.test.ts - See research.md:57-73
- [x] T013 [P] Unit test email provider factory in tests/unit/utils/email.utils.test.ts - See research.md:41-52

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T014 Create Prisma migration for OtpRequest model and User updates - See data-model.md:48-75 for schema, data-model.md:127-147 for SQL
- [x] T015 [P] Implement OTP generation utilities in src/utils/otp.utils.ts - See research.md:57-73 for crypto.randomInt() pattern
- [x] T016 [P] Implement email provider factory and mock provider in src/utils/email.utils.ts - See research.md:41-52 for interface & factory
- [x] T017 [P] Implement Mailgun provider in src/utils/email.utils.ts - See research.md:18-24 for Mailgun config
- [x] T018 [P] Create OTP validation schemas in src/features/otp-auth/otp-auth.validation.ts - See contracts/otp-auth-api.yaml for request/response schemas
- [x] T019 [P] Implement OTP service business logic in src/features/otp-auth/otp-auth.service.ts - See data-model.md:77-123 for query patterns, include inline cleanup
- [x] T020 [P] Implement OTP controller request handlers in src/features/otp-auth/otp-auth.controller.ts - See contracts/otp-auth-api.yaml for endpoints
- [x] T021 Create OTP routes with rate limiting in src/features/otp-auth/otp-auth.routes.ts - Use existing createRateLimiter with email key
- [x] T022 Register OTP routes in src/app.ts - See plan.md:98-104 for feature structure

## Phase 3.4: Integration
- [ ] T023 Update User service to handle OTP-created users - See data-model.md:114-123 for upsert pattern
- [ ] T024 Add OTP metrics logging - See data-model.md:166-170 for performance considerations

## Phase 3.5: Polish
- [ ] T025 [P] Update API documentation with OTP endpoints - Use contracts/otp-auth-api.yaml content
- [ ] T026 Run quickstart.md test scenarios manually - See quickstart.md:206-219 for checklist
- [ ] T027 Update CLAUDE.md with OTP feature context - See plan.md:183 for update approach
- [ ] T028 [OPTIONAL] Performance test OTP verification (<100ms) - See plan.md:41 for goal
- [ ] T029 [OPTIONAL] Test email delivery time (<60 seconds) in production - See plan.md:41 for goal

## Dependencies
- Setup (T001-T005) must complete first
- Tests (T006-T013) before implementation (T014-T022)
- T014 (migration) blocks T019 (service using DB)
- T015-T017 (utilities) before T019 (service using utilities)
- T018 (validation) before T020 (controller using validation)
- T019 (service) before T020 (controller)
- T020 (controller) before T021 (routes)
- T021 (routes) before T022 (app registration)
- T023-T024 (integration) after core implementation
- All implementation before polish (T025-T029)

## Parallel Example
```
# Launch T006-T013 together (all test files):
Task: "Contract test POST /api/v1/auth/otp/request in tests/integration/features/otp-auth/request.test.ts"
Task: "Contract test POST /api/v1/auth/otp/verify in tests/integration/features/otp-auth/verify.test.ts"
Task: "Contract test GET /api/v1/auth/otp/status in tests/integration/features/otp-auth/status.test.ts"
Task: "Integration test new user OTP registration flow"
Task: "Integration test existing user OTP login flow"
Task: "Integration test rate limiting"
Task: "Unit test OTP generation and validation"
Task: "Unit test email provider factory"

# Launch T015-T020 together (different files):
Task: "Implement OTP generation utilities in src/utils/otp.utils.ts"
Task: "Implement email provider factory in src/utils/email.utils.ts"
Task: "Implement Mailgun provider in src/utils/email.utils.ts"
Task: "Create OTP validation schemas in src/features/otp-auth/otp-auth.validation.ts"
Task: "Implement OTP service business logic in src/features/otp-auth/otp-auth.service.ts"
Task: "Implement OTP controller request handlers in src/features/otp-auth/otp-auth.controller.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Use mock email provider in development
- Production requires Mailgun configuration
- OTP codes are 6 digits, expire in 10 minutes
- Maximum 5 failed attempts per OTP
- Rate limit: 3 requests per 15 minutes per email

## Critical Implementation Details

### OTP Service (T019) - Key Methods to Implement
1. **requestOtp(email)**:
   - Check rate limit using data-model.md:93-101 query
   - Generate OTP using research.md:57-73 pattern
   - Store in DB with 10min expiry
   - Send email via provider factory

2. **verifyOtp(email, code)**:
   - Find valid OTP using data-model.md:79-91 query
   - Check attempts < 5 and not expired
   - Increment attempts on failure
   - Mark as used on success (data-model.md:103-109)
   - Create/update user (data-model.md:111-123)
   - Return JWT token

3. **getOtpStatus(email)**:
   - Check for active OTP
   - Calculate time remaining
   - Check if new request allowed

### Email Provider Factory (T016) - Structure
```typescript
// From research.md:43-52
interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>
}

class MockEmailProvider implements EmailProvider {
  // Console.log OTP in development
}

class MailgunProvider implements EmailProvider {
  // Use Mailgun.js SDK
}

const createEmailProvider = (): EmailProvider => {
  return process.env.NODE_ENV === 'production'
    ? new MailgunProvider()
    : new MockEmailProvider()
}
```

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - POST /api/v1/auth/otp/request → T006 contract test [P]
   - POST /api/v1/auth/otp/verify → T007 contract test [P]
   - GET /api/v1/auth/otp/status → T008 contract test [P]

2. **From Data Model**:
   - OtpRequest entity → T014 migration task
   - User modifications → T024 user service update

3. **From User Stories**:
   - New user registration → T009 integration test [P]
   - Existing user login → T010 integration test [P]
   - Rate limiting → T011 integration test [P]

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T006-T008)
- [x] All entities have model tasks (T014)
- [x] All tests come before implementation (T006-T013 before T014-T022)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task