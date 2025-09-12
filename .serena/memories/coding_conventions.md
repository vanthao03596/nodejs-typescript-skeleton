# Coding Conventions

## Response System
- All API responses use utilities from `src/utils/response.utils.ts`
- **successResponse()**: Standard success responses with optional data/meta
- **paginatedResponse()**: Paginated data responses with meta information
- **errorResponse()**: Consistent error responses with error codes
- All responses follow **snake_case** naming convention
- Error responses include stack traces in development mode only

## Database Conventions
- Uses Prisma with MySQL
- **INT primary keys** for all models
- **Snake_case** database column mapping
- Current schema includes User model with email, password, name, timestamps

## Authentication Pattern
- JWT-based authentication with configurable expiration
- Password hashing with bcrypt (via password.utils.ts)
- Protected routes use auth.middleware.ts
- Rate limiting applies to all endpoints via rateLimiter.middleware.ts

## File Naming
- Use kebab-case for file names (auth.controller.ts, auth.service.ts)
- Feature files grouped in feature directories
- Suffix files by type: .controller.ts, .service.ts, .routes.ts, .validation.ts

## Error Handling
- Custom error classes in `src/utils/errors.ts` extending base AppError
- Global error handling via error.middleware.ts
- Validation errors handled by validation.middleware.ts using Zod schemas

## Testing Conventions
- Uses Vitest (not Jest!)
- Test files in `tests/` directory with `unit/` and `integration/` subdirectories
- 10-second test timeout configured
- Coverage collection for `src/` files excluding server.ts