// The fonts the demo lays its PDF out with, copied from apps/demo/public so the
// repository keeps them once. public/fonts is left out of git.

import { cpSync } from 'node:fs';

cpSync(new URL('../../demo/public/fonts', import.meta.url), new URL('../public/fonts', import.meta.url), { recursive: true });
