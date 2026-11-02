import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/ui/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/buildings/types.ts'],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage'
    }
  }
});
