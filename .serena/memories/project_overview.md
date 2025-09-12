# Project Overview

This is a Node.js backend API skeleton built with TypeScript, Express.js, Prisma ORM, and Redis. It provides JWT-based authentication, rate limiting, input validation, and comprehensive error handling.

## Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **Database**: MySQL with Prisma ORM v6
- **Cache/Sessions**: Redis v5
- **Testing**: Vitest (migrated from Jest)
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schemas
- **Code Quality**: ESLint + Prettier

## Core Architecture Principles
- **KISS (Keep It Simple, Stupid)**: Simplicity should be a key goal in design
- **YAGNI (You Aren't Gonna Need It)**: Avoid building functionality on speculation
- **Feature-based organization**: Each feature contains controller, service, routes, and validation files
- **Composition over inheritance**: Prefer composing functionality rather than class inheritance
- **Use existing utilities**: Always check for existing functionality before creating new utilities