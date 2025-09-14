# Speckit API Constitution

## Core Principles

### I. Feature-First Architecture
Every feature MUST be organized under `src/features/[feature-name]/` with:
- `[feature].controller.ts` - Request handling and response formatting
- `[feature].service.ts` - Business logic implementation
- `[feature].routes.ts` - Route definitions and middleware binding
- `[feature].validation.ts` - Zod schemas for request validation
- Self-contained, independently testable components
- Clear separation of concerns between layers

### II. Standardized Response Protocol
All API responses MUST use utilities from `src/utils/response.utils.ts`:
- Success responses via `successResponse()` with consistent structure
- Error responses via `errorResponse()` with proper HTTP status codes
- Paginated data via `paginatedResponse()` with meta information
- Snake_case naming convention for all response fields
- Stack traces only in development environment

### III. Test-First Development (NON-NEGOTIABLE)
Vitest TDD mandatory for all features:
- Unit tests written BEFORE implementation
- Integration tests for database operations
- Tests must FAIL before implementation begins
- Coverage collection configured for `src/` directory
- Test files in `tests/unit/` and `tests/integration/` structure

### IV. Validation-First Middleware
Request validation MUST precede business logic:
- Zod schemas define input contracts in `[feature].validation.ts`
- Validation middleware applied at route level
- Support for body, query, and params validation
- Validated data attached to `req.validatedBody|Query|Params`
- Detailed validation error responses with field-level messages

### V. Simplicity & YAGNI Enforcement
Keep implementations simple and focused:
- KISS principle: choose straightforward solutions over complex ones
- YAGNI principle: implement features only when needed
- Maximum 3 middleware layers per route unless justified
- Prefer composition over inheritance
- Use existing utilities before creating new ones

## Technology Standards

### Database & ORM
- Prisma ORM with MySQL as the primary database
- Snake_case database column mapping
- INT primary keys for all models
- Database migrations via `npm run db:migrate`
- Schema generation via `npm run db:generate`

### Authentication & Security
- JWT-based authentication with configurable expiration
- Password hashing with bcrypt (minimum 10 rounds)
- Redis-based rate limiting for all endpoints
- Helmet.js for security headers
- CORS configuration for cross-origin requests

### Error Handling
- Custom error classes extending base `AppError`
- Global error middleware catching all unhandled errors
- Consistent error response format
- Proper HTTP status codes for different error types
- Environment-specific error details

## Development Workflow

### Code Quality Gates
- ESLint with TypeScript configuration
- Prettier for consistent code formatting
- All code MUST pass linting before commit
- Type checking with TypeScript strict mode
- Coverage requirements for new features

### Environment Management
- Environment variables validated via Zod schemas
- `.env.example` as the template for configuration
- Database URL, Redis URL, and JWT secrets required
- Development/production environment distinction

### Testing Requirements
- Vitest as the testing framework
- Test setup file at `tests/setup.ts`
- 10-second timeout for all tests
- UI testing available via `npm run test:ui`
- Coverage reports via `npm run test:coverage`

## Governance

Constitution supersedes all other development practices. All features, middleware, and utilities MUST comply with these principles.

Amendments require:
- Explicit documentation of rationale for change
- Review and approval by project maintainers
- Backwards compatibility assessment
- Update of relevant examples and documentation

**Version**: 1.0.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15