# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js backend API skeleton built with TypeScript, Express.js, Prisma ORM, and Redis. It provides JWT-based authentication, rate limiting, input validation, and comprehensive error handling.

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

### Database Schema
Uses Prisma with MySQL. Current schema includes:
- `User` model with email, password, name, timestamps
- UUID primary keys
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