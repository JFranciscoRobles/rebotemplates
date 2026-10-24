// `npm run sample -- folder`: the invoice of test-templates/ written as files, to try the command line on:
// invoice.docx, invoice.json and computed.mjs.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { invoice, invoiceData } from '../test-templates/invoice';

const folder = process.argv.slice(2).find((arg) => arg !== '--');
if (!folder) throw new Error('Say where: npm run sample -- folder');
mkdirSync(folder, { recursive: true });
writeFileSync(join(folder, 'invoice.docx'), invoice());
writeFileSync(join(folder, 'invoice.json'), `${JSON.stringify({ ...invoiceData(), paid: true }, null, 2)}\n`);
writeFileSync(
  join(folder, 'computed.mjs'),
  `// What the invoice works out in code: each line's amount, and the total.
export default {
  'items.amount': (item) => item.qty * item.price,
  total: (_, data) => data.items.reduce((sum, item) => sum + item.qty * item.price, 0),
};
`,
);
