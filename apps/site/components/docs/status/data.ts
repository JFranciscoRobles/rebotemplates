// What the page says was measured, as it was measured: these numbers come
// from running the commands, not from memory. Run them again and update them,
// with the "What is checked" of ROADMAP.md. As Rebodocs' status/data.ts.

/** When the numbers below were taken. */
export const MEASURED = 'October 24, 2026';

/** `npm test`, its tests by where they are. */
export const TESTS: { where: string; count: number; what: string }[] = [
  {
    where: 'packages/core',
    count: 15,
    what: 'Values missing (marked, empty, kept, a whole object, a block), 0 and false as values, computed values for each item and for the whole, lists inside lists, dates, check, inspect, a template read once.',
  },
  {
    where: 'packages/mcp',
    count: 12,
    what: 'The protocol; listing, inspecting, checking and rendering; paths outside the folder refused; a finished invoice and a finished contract turned into templates that make the same documents.',
  },
  {
    where: 'test-templates',
    count: 10,
    what: 'An invoice, a contract and a letter in Spanish rendered and read back from the DOCX; a template as Word writes one, its variables cut into runs.',
  },
  { where: 'packages/cli', count: 6, what: 'inspect, check, render from stdin, one document per line, --strict, names of files.' },
  { where: 'packages/pdf', count: 2, what: 'The invoice as a PDF, and the families no font was found for.' },
];

/** `npm run bench`: the invoice. */
export const BENCH = {
  machine: 'an Apple M1 with Node 22',
  rows: [
    ['DOCX, from a template loaded once', '0.7 ms', '1.0 ms'],
    ['DOCX, from the template’s bytes', '1.1 ms', '1.6 ms'],
    ['PDF, from a template loaded once', '3.3 ms', '5.3 ms'],
    ['The first render of a process', '15 ms', ''],
  ] as [string, string, string][],
  docx: '0.7 ms',
  pdf: '3.3 ms',
};

/** `npm run size`: minified for the browser, Rebodocs' engine in it. */
export const SIZE = {
  min: '150 KB',
  gzip: '47 KB',
  rows: [
    ['render (all of core)', '150 KB', '47 KB'],
    ['filling and the PDF', '196 KB', '62 KB'],
  ] as [string, string, string][],
};
