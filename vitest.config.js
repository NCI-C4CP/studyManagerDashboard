import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'https://example.com/' },
    },
    globals: true,
    setupFiles: ['./tests/testSetup.js'],
    include: ['tests/**/*.spec.js'],
    testTimeout: 5000,
  },
});
