// The invoice of the landing, as a Word template made in code: written in the
// suite's syntax, with a row of a table that repeats for each item and a
// PAID line only when it is paid. Its data is the handoff's.

import { type Doc, type Paragraph, type RunProps, createDoc, exportDocx, insertTable, insertText, setParagraphStyle } from '@rebodocs/core';

/** Calibri, as Word writes by default; the demo lays it out with Carlito, which has its measures. */
const TEXT: RunProps = { fontFamily: 'Calibri', fontSize: 11 };
const p = (text: string, props: RunProps = {}): Paragraph => ({ props: {}, runs: [{ text, props: { ...TEXT, ...props } }] });

export function invoiceDoc(): Doc {
  let doc = createDoc([
    p('Invoice {{number}}', { bold: true, fontSize: 20 }),
    p('Billed to {{client.name}}, {{client.city}}.'),
    p('Date {{date}} · due in {{due_days}} days'),
    p('{{#paid}}PAID{{/paid}}', { bold: true, color: '2E6B3C' }),
    p(''),
    p('Acme Ltd. · invoice-{{number}}.pdf', { fontSize: 8, color: '6B6964' }),
  ]);
  doc = setParagraphStyle(doc, 0, 0, 'Heading1');
  doc = insertTable(doc, { para: 4, offset: 0 }, 3, 4).doc;
  const cells = doc.paragraphs.flatMap((q, i) => (q.cell ? [i] : []));
  const texts = [
    'Item',
    'Qty',
    'Price',
    'Amount',
    '{{#items}}{{items.name}}',
    '{{items.qty}}',
    '{{items.price | currency}}',
    '{{items.amount | currency}}{{/items}}',
    'Total',
    '',
    '',
    '{{total | currency}}',
  ];
  texts.forEach((text, k) => {
    // The heading row and the total in bold, as an invoice has them.
    if (text) doc = insertText(doc, { para: cells[k], offset: 0 }, text, k < 4 || k >= 8 ? { ...TEXT, bold: true } : TEXT).doc;
  });
  return doc;
}

export const invoice = (): Uint8Array => exportDocx(invoiceDoc());

export const invoiceData = () => ({
  number: '0144',
  date: '24 Oct 2026',
  due_days: 15,
  paid: false,
  client: { name: 'Northwind S.A.', city: 'Monterrey' },
  items: [
    { name: 'Design sprint', qty: 2, price: 1800 },
    { name: 'Editor licences', qty: 12, price: 49 },
    { name: 'Translations', qty: 3, price: 210 },
  ],
});

type Item = { qty: number; price: number };
/** What the invoice works out in code: each line's amount, and the total. */
export const invoiceComputed = {
  'items.amount': (item: Record<string, unknown>) => (item.qty as number) * (item.price as number),
  total: (_: Record<string, unknown>, data: Record<string, unknown>) => (data.items as Item[]).reduce((sum, item) => sum + item.qty * item.price, 0),
};
