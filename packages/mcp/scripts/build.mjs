// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('mcp', {
  entries: { index: 'src/server.ts', cli: 'src/main.ts' },
  exports: { '.': 'index' },
  bin: { 'rebotemplates-mcp': 'cli' },
  node: true,
  keywords: ['docx', 'word', 'template', 'mcp', 'model-context-protocol', 'claude', 'ai', 'document-generation'],
  homepage: 'https://rebotemplates.com/docs/getting-started/',
});
