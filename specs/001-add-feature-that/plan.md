# Implementation Plan: OTP Email Login

**Branch**: `001-add-feature-that` | **Date**: 2025-09-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-add-feature-that/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement OTP-based email authentication allowing users to log in with a one-time password sent to their email. The system will use Mailgun.js for production email delivery, a mock provider for development, MySQL for OTP storage, and Redis for rate limiting. The feature enables both new user registration and existing user authentication through a unified flow.

## Technical Context
**Language/Version**: TypeScript/Node.js 20.x
**Primary Dependencies**: Express.js, Mailgun.js, Prisma ORM, Redis, Zod
**Storage**: MySQL (OTP storage via Prisma), Redis (rate limiting)
**Testing**: Vitest (unit and integration tests)
**Target Platform**: Linux server / Docker container
**Project Type**: web (backend API)
**Performance Goals**: <60 seconds email delivery, <100ms OTP validation
**Constraints**: 10-minute OTP validity, 5 failed attempts max, 3 requests per 15 minutes rate limit
**Scale/Scope**: Support concurrent OTP requests, 10k+ users

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Feature-First Architecture**:
- ✅ Feature organized under `src/features/otp-auth/`
- ✅ Controller/Service/Routes/Validation files planned
- ✅ Self-contained and independently testable
- ✅ Clear separation of concerns between layers

**Response Protocol**:
- ✅ Using `response.utils.ts` for all responses
- ✅ Success/Error/Paginated response patterns followed
- ✅ Snake_case naming convention for response fields
- ✅ Stack traces only in development environment

**Test-First Development (NON-NEGOTIABLE)**:
- ✅ Vitest TDD mandatory: Tests written BEFORE implementation
- ✅ Unit tests for business logic, integration tests for DB operations
- ✅ Tests MUST FAIL before implementation begins
- ✅ Coverage collection for `src/` directory configured
- ✅ Test files in `tests/unit/` and `tests/integration/`

**Validation-First Middleware**:
- ✅ Zod schemas in `otp-auth.validation.ts`
- ✅ Validation middleware applied at route level
- ✅ Support for body/query/params validation
- ✅ Validated data attached to `req.validatedBody|Query|Params`

**Simplicity & YAGNI**:
- ✅ Maximum 3 middleware layers per route (rate limit, validation, auth)
- ✅ Using existing utilities before creating new ones
- ✅ KISS principle: straightforward solutions over complex ones
- ✅ YAGNI principle: implementing only needed features
- ✅ Version number assigned: 1.0.0
- ✅ BUILD increments on every change
- ✅ Breaking changes handled with migration plan

## Project Structure

### Documentation (this feature)
```
specs/001-add-feature-that/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Backend API structure (existing)
src/
├── features/
│   ├── otp-auth/        # New feature
│   │   ├── otp-auth.controller.ts
│   │   ├── otp-auth.service.ts
│   │   ├── otp-auth.routes.ts
│   │   └── otp-auth.validation.ts
│   ├── auth/            # Existing auth
│   └── health/          # Existing health
├── config/
│   ├── email.ts         # New: Email configuration
│   └── [existing configs]
├── utils/
│   ├── email.utils.ts   # New: Email sending utilities
│   ├── otp.utils.ts     # New: OTP generation/validation
│   └── [existing utils]
└── middleware/
    └── [existing middleware]

tests/
├── unit/
│   └── features/
│       └── otp-auth/
├── integration/
│   └── features/
│       └── otp-auth/
└── setup.ts
```

**Structure Decision**: Backend API only (Option 2: Web application - backend portion)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Mailgun.js integration patterns for Node.js
   - Mock email provider implementation for development
   - OTP storage schema design with Prisma
   - Redis rate limiting with existing middleware
   - Session management after OTP verification

2. **Generate and dispatch research agents**:
   ```
   Task: "Research Mailgun.js SDK integration for Node.js/TypeScript"
   Task: "Find best practices for OTP generation and security"
   Task: "Research email mocking strategies for development/testing"
   Task: "Analyze Prisma schema patterns for OTP storage with expiration"
   Task: "Review Redis rate limiting integration with Express middleware"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - OtpRequest entity: email, code, created_at, expires_at, attempts, used
   - User entity updates: link to OTP requests
   - Session entity: user_id, token, expires_at

2. **Generate API contracts** from functional requirements:
   - POST /api/v1/auth/otp/request - Request OTP
   - POST /api/v1/auth/otp/verify - Verify OTP and authenticate
   - GET /api/v1/auth/otp/status - Check OTP request status
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - New user OTP flow → integration test
   - Existing user OTP flow → integration test
   - Rate limiting scenarios → integration test
   - OTP expiration handling → unit test

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/bash/update-agent-context.sh claude`
   - Add Mailgun.js, OTP patterns to CLAUDE.md
   - Update recent changes section
   - Keep under 150 lines for token efficiency

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md updates

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Models → Services → Controllers → Routes
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations - all constitutional principles satisfied*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*