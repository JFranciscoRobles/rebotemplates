// The tests. `node` is every test of the packages, the demos and the
// templates of test-templates/, as `npm test` runs them.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts', 'test-templates/**/*.test.ts'],
          exclude: ['**/node_modules/**'],
        },
      },
    ],
  },
});
