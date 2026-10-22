import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // A clean CI runner may need to pull the PostgreSQL image first.
    hookTimeout: 120_000,
    globals: false
  }
});
