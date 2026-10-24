// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('cli', {
  entries: { index: 'src/main.ts', cli: 'src/bin.ts' },
  exports: { '.': 'index' },
  bin: { rebotemplates: 'cli' },
  node: true,
  keywords: ['docx', 'word', 'pdf', 'template', 'cli', 'document-generation'],
  homepage: 'https://rebotemplates.com/docs/getting-started/#cli',
});
