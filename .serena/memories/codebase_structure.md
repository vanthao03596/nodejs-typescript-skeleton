# Codebase Structure

## Directory Organization

### src/
- **app.ts**: Express app configuration and middleware setup
- **server.ts**: Server entry point (excluded from test coverage)

### src/config/
- **env.ts**: Environment variable validation using Zod
- **database.ts**: Prisma client setup
- **redis.ts**: Redis connection configuration

### src/features/
Feature-based organization with each feature containing:
- Controller (HTTP request handling)
- Service (business logic)
- Routes (endpoint definitions)
- Validation (Zod schemas)

Current features:
- **auth/**: JWT authentication with login/register
- **health/**: Health check endpoints

### src/middleware/
- **auth.middleware.ts**: JWT token verification
- **rateLimiter.middleware.ts**: Redis-based rate limiting
- **error.middleware.ts**: Global error handling and 404 responses
- **validation.middleware.ts**: Zod schema validation

### src/utils/
- **jwt.utils.ts**: JWT token creation/verification
- **password.utils.ts**: Bcrypt password hashing
- **redis.utils.ts**: Redis helper functions
- **response.utils.ts**: Standardized API response utilities
- **pagination.utils.ts**: Pagination helpers with Prisma integration
- **errors.ts**: Custom error classes extending base AppError

### src/types/
- **response.types.ts**: TypeScript response interfaces
- **express.d.ts**: Express type augmentations

### tests/
- **unit/**: Unit tests for individual components
- **integration/**: Integration tests for API endpoints
- **setup.ts**: Test setup configuration
- **test-app.ts**: Test application setup