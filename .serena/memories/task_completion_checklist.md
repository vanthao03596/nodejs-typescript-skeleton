# Task Completion Checklist

## After Completing Any Development Task

1. **Code Quality Checks**
   ```bash
   npm run lint            # Check for linting issues
   npm run lint:fix        # Auto-fix any fixable issues
   npm run format          # Format code with Prettier
   ```

2. **Testing**
   ```bash
   npm test               # Run Vitest test suite
   npm run test:coverage  # Verify coverage if needed
   ```

3. **Build Verification**
   ```bash
   npm run build          # Ensure TypeScript compiles without errors
   ```

## AI Assistant Guidelines

### Before Implementation
- Always check existing patterns first
- Use existing utilities before creating new ones
- Check for similar functionality in other features
- Validate understanding before implementation

### Common Pitfalls to Avoid
- Creating duplicate functionality
- Overwriting existing tests
- Modifying core frameworks without explicit instruction
- Adding dependencies without checking existing alternatives
- Using Jest instead of Vitest for testing

### Architecture Decisions
- Break complex tasks into smaller, testable units
- Use composition over inheritance
- Follow the existing feature-based structure
- Maintain snake_case for API responses
- Use Zod for validation schemas