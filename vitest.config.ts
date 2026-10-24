// The tests. `node` is every test of the packages, the demos and the
// templates of test-templates/, as `npm test` runs them.
//
// They run on the @rebodocs/core npm installed. With REBODOCS set to a
// checkout of Rebodocs (`REBODOCS=../docs npm test`), they run on its source
// instead: how a change made there first (Rebodocs first) is tried here
// before it is published.

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const rebodocs = process.env.REBODOCS;

export default defineConfig({
  resolve: { alias: rebodocs ? { '@rebodocs/core': resolve(rebodocs, 'packages/core/src/index.ts') } : {} },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts', 'test-templates/**/*.test.ts'],
          exclude: ['**/node_modules/**'],
        },
      },
    ],
  },
});
