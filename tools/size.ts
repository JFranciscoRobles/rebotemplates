// `npm run size`: what @rebotemplates/core weighs in a bundle, minified, raw
// and gzipped, with Rebodocs' engine in it; and @rebotemplates/pdf's part, for
// what a function that makes PDFs carries. What the landing says about size
// comes from here.

import { gzipSync } from 'node:zlib';
import { build } from 'vite';

async function size(entry: string, label: string) {
  const out = await build({
    configFile: false,
    logLevel: 'silent',
    build: { write: false, minify: true, lib: { entry, formats: ['es'], fileName: 'bundle' }, rollupOptions: { external: [/^node:/] } },
  });
  const chunks = (Array.isArray(out) ? out : [out]).flatMap((one) => ('output' in one ? one.output : [])).filter((chunk) => chunk.type === 'chunk');
  const code = chunks.map((chunk) => (chunk.type === 'chunk' ? chunk.code : '')).join('');
  const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;
  console.log(`${label.padEnd(44)} ${kb(code.length).padStart(7)} minified, ${kb(gzipSync(code).length).padStart(6)} gzipped`);
}

await size('packages/core/src/index.ts', '@rebotemplates/core (render, fill, check):');
await size('tools/size-render.ts', 'render alone, as an application imports it:');
await size('tools/size-pdf.ts', 'fill and the PDF, without the font search:');
