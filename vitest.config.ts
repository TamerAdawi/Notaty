import { defineConfig } from 'vitest/config';

// The parser is pure and DOM-free, so tests run in a plain Node environment
// (and avoid loading the PWA build plugin from vite.config).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
