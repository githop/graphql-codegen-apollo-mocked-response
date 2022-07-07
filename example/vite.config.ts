// Configure Vitest (https://vitest.dev/config/)

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    /* for example, use global to avoid globals imports (describe, test, expect): */
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/component/test/setup.ts',
    deps: {
      inline: true,
      interopDefault: true,
    },
  },
});
