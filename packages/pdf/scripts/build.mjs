// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('pdf', {
  entries: { index: 'src/index.ts' },
  exports: { '.': 'index' },
  node: true,
  keywords: ['docx', 'word', 'pdf', 'template', 'document-generation', 'invoice'],
  homepage: 'https://rebotemplates.com/docs/getting-started/#pdf',
});
