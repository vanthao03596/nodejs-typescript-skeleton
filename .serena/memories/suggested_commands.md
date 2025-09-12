# Suggested Commands

## Development
```bash
npm run dev              # Start development server with nodemon
npm run build           # Compile TypeScript to dist/
npm run start           # Start production server from dist/
```

## Testing (Vitest - not Jest!)
```bash
npm test                # Run Vitest test suite
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with Vitest UI
npm run test:coverage   # Run tests with coverage report
```

## Code Quality
```bash
npm run lint            # Lint TypeScript files with ESLint
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format code with Prettier
```

## Database (Prisma)
```bash
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio GUI
```

## Development Workflow
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Run database migrations: `npm run db:migrate`
4. Start development: `npm run dev`
5. Server runs on port 3000 by default

## After Task Completion
Always run these commands after completing a task:
```bash
npm run lint            # Check for linting issues
npm run format          # Format code
npm test               # Run tests to ensure nothing is broken
```