// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('core', {
  entries: { index: 'src/index.ts' },
  exports: { '.': 'index' },
  keywords: ['docx', 'word', 'template', 'templates', 'mail-merge', 'document-generation', 'invoice', 'report'],
  homepage: 'https://rebotemplates.com/docs/getting-started/',
});
