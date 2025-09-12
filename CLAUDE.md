# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js backend API skeleton built with TypeScript, Express.js, Prisma ORM, and Redis. It provides JWT-based authentication, rate limiting, input validation, and comprehensive error handling.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

## 🤖 AI Assistant Guidelines

### Context Awareness
- When implementing features, always check existing patterns first
- Prefer composition over inheritance in all designs
- Use existing utilities before creating new ones
- Check for similar functionality in other domains/features

### Common Pitfalls to Avoid
- Creating duplicate functionality
- Overwriting existing tests
- Modifying core frameworks without explicit instruction
- Adding dependencies without checking existing alternatives

### Workflow Patterns
- Use "think hard" for architecture decisions
- Break complex tasks into smaller, testable units
- Validate understanding before implementation

## Common Development Commands

```bash
# Development
npm run dev              # Start development server with nodemon
npm run build           # Compile TypeScript to dist/
npm run start           # Start production server from dist/

# Testing
npm test                # Run Jest test suite
npm run test:watch      # Run tests in watch mode

# Code Quality
npm run lint            # Lint TypeScript files with ESLint
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format code with Prettier

# Database (Prisma)
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio GUI
```

## Architecture

### Feature-Based Organization
The codebase follows a feature-based structure under `src/features/`:
- Each feature contains controller, service, routes, and validation files
- Currently includes `auth` (authentication) and `health` (health checks) features

### Key Architectural Components

**Configuration** (`src/config/`):
- `env.ts`: Environment variable validation using Zod
- `database.ts`: Prisma client setup
- `redis.ts`: Redis connection configuration

**Middleware** (`src/middleware/`):
- `auth.middleware.ts`: JWT token verification
- `rateLimiter.middleware.ts`: Redis-based rate limiting
- `error.middleware.ts`: Global error handling and 404 responses
- `validation.middleware.ts`: Zod schema validation

**Utilities** (`src/utils/`):
- `jwt.utils.ts`: JWT token creation/verification
- `password.utils.ts`: Bcrypt password hashing
- `redis.utils.ts`: Redis helper functions
- `response.utils.ts`: Standardized API response utilities
- `pagination.utils.ts`: Pagination helpers with Prisma integration
- `errors.ts`: Custom error classes extending base AppError

### Response System
Standardized API responses using utilities in `src/utils/response.utils.ts`:
- `successResponse()`: Standard success responses with optional data/meta
- `paginatedResponse()`: Paginated data responses with meta information
- `errorResponse()`: Consistent error responses with error codes
- All responses follow snake_case naming convention
- Error responses include stack traces in development mode only

### Database Schema
Uses Prisma with MySQL. Current schema includes:
- `User` model with email, password, name, timestamps
- INT primary keys
- Snake_case database column mapping

### Authentication Flow
- JWT-based authentication with configurable expiration
- Password hashing with bcrypt
- Protected routes use auth middleware
- Rate limiting applies to all endpoints

## Testing Setup

- Jest with TypeScript support via ts-jest
- Test files in `tests/` directory with `unit/` and `integration/` subdirectories
- Coverage collection configured for `src/` files
- Test setup file at `tests/setup.ts`
- 10-second test timeout configured

## Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL`: MySQL connection string
- `REDIS_URL`: Redis connection string  
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRES_IN`: JWT expiration time
- `RATE_LIMIT_WINDOW`: Rate limit time window
- `RATE_LIMIT_MAX`: Maximum requests per window

## Development Workflow

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Run database migrations: `npm run db:migrate`
4. Start development: `npm run dev`
5. Server runs on port 3000 by default

## Production Deployment

Supports both Docker and PM2 deployment:
- Docker: Uses multi-stage build with nginx reverse proxy
- PM2: Configuration in `ecosystem.config.js`
- Build step: `npm run build` creates `dist/` directory