import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/**/*.{test,spec}.ts',
      'src/**/*.{test,spec}.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts',
      'tests/setup.ts',
      'tests/test-app.ts'
    ],
    coverage: {
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/server.ts'
      ],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage'
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000
  }
})