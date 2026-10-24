// `npm run bench`: how long the invoice of test-templates/ takes, to DOCX and
// to PDF, on this machine. The first render is the cold one (the engine
// warming up); the others are what a running server sees. What the landing
// and the status page say about speed comes from here, with the machine said.

import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { loadTemplate, render } from '@rebotemplates/core';
import { toPdf } from '@rebotemplates/pdf';
import { invoice, invoiceComputed, invoiceData } from '../test-templates/invoice';

const time = (runs: number, work: () => void) => {
  const all: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    work();
    all.push(performance.now() - start);
  }
  all.sort((a, b) => a - b);
  return { median: all[Math.floor(all.length / 2)], p95: all[Math.floor(all.length * 0.95)] };
};
const ms = (n: number) => `${n.toFixed(1)} ms`;

const bytes = invoice();
const options = { computed: invoiceComputed, locale: 'en-US', currency: 'USD' };

const coldStart = performance.now();
render(bytes, invoiceData(), options);
const cold = performance.now() - coldStart;

const fromBytes = time(1000, () => render(bytes, invoiceData(), options));
const once = loadTemplate(bytes);
const fromLoaded = time(1000, () => render(once, invoiceData(), options));
toPdf(once, invoiceData(), options);
const pdf = time(100, () => toPdf(once, invoiceData(), options));

console.log(`Machine: ${cpus()[0]?.model ?? 'unknown'}, Node ${process.version}`);
console.log(`DOCX, first render (cold):            ${ms(cold)}`);
console.log(`DOCX, from the template's bytes:      median ${ms(fromBytes.median)}, p95 ${ms(fromBytes.p95)} (1000 runs)`);
console.log(`DOCX, from a template loaded once:    median ${ms(fromLoaded.median)}, p95 ${ms(fromLoaded.p95)} (1000 runs)`);
console.log(`PDF, from a template loaded once:     median ${ms(pdf.median)}, p95 ${ms(pdf.p95)} (100 runs)`);
