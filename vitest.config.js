import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [/config\/local-dev\//],
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'https://example.com/' },
    },
    globals: true,
    setupFiles: ['./tests/testSetup.js'],
    include: ['tests/**/*.spec.js'],
    testTimeout: 5000,
    server: {
      deps: {
        external: [/config\/local-dev\//],
      },
    },
  },
});
