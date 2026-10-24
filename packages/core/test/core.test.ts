import { describe, expect, it } from 'vitest';
import { type Paragraph, createDoc, docText, exportDocx, importDocx } from '@rebodocs/core';
import { check, fill, inspect, loadTemplate, render } from '../src';
import { invoice, invoiceComputed, invoiceData } from '../../../test-templates/invoice';

const p = (text: string): Paragraph => ({ props: {}, runs: [{ text, props: {} }] });
const template = (...lines: string[]) => exportDocx(createDoc(lines.map(p)));
const lines = (docx: Uint8Array) => docText(importDocx(docx)).split('\n');

describe('values the data lacks', () => {
  const letter = template('Dear {{client.name}} of {{client.city}},', '{{#items}}', '- {{items.name}}: {{items.price | currency}}', '{{/items}}');
  const data = { client: { name: 'Ana' }, items: [{ name: 'Desk', price: 250 }, { name: 'Chair' }] };

  it('shows them as [path] in the document, and says which, item by item', () => {
    const out = render(letter, data, { locale: 'en-US' });
    expect(lines(out.docx)).toEqual(['Dear Ana of [client.city],', '- Desk: $250.00', '- Chair: [items.price]']);
    expect(out.missing).toEqual(['client.city', 'items[1].price']);
  });

  it('leaves them out when asked', () => {
    expect(lines(render(letter, data, { missing: 'empty', locale: 'en-US' }).docx)).toEqual(['Dear Ana of ,', '- Desk: $250.00', '- Chair: ']);
  });

  it('keeps the {{variable}} when asked, to be filled later', () => {
    expect(lines(render(letter, data, { missing: 'keep', locale: 'en-US' }).docx)[0]).toBe('Dear Ana of {{client.city}},');
  });

  it('takes a whole object missing on the way as missing, not as an error', () => {
    const out = render(letter, { items: [] });
    expect(lines(out.docx)).toEqual(['Dear [client.name] of [client.city],']);
    expect(out.missing).toEqual(['client.name', 'client.city']);
  });

  it('takes a block without a value as not there, rather than leaving its marks', () => {
    const out = render(letter, { client: { name: 'Ana', city: 'Lima' } });
    expect(lines(out.docx)).toEqual(['Dear Ana of Lima,']);
    expect(out.missing).toEqual(['items']);
  });

  it('counts 0 and false as values, not as missing', () => {
    const out = render(template('{{count}} left, sent: {{sent}}'), { count: 0, sent: false });
    expect(out.missing).toEqual([]);
    expect(lines(out.docx)).toEqual(['0 left, sent: false']);
  });
});

describe('values computed in code', () => {
  it('works one out for each item of a list, and one for the whole', () => {
    const out = render(invoice(), invoiceData(), { computed: invoiceComputed, locale: 'en-US' });
    expect(out.missing).toEqual([]);
    expect(lines(out.docx)).toContain('$3,600.00');
    expect(lines(out.docx)).toContain('$4,818.00');
  });

  it('follows lists inside lists', () => {
    const doc = template('{{#orders}}', '{{orders.id}}: {{#orders.lines}}{{orders.lines.total}} {{/orders.lines}}', '{{/orders}}');
    const out = render(
      doc,
      {
        orders: [
          {
            id: 'A',
            lines: [
              { q: 2, p: 5 },
              { q: 1, p: 3 },
            ],
          },
        ],
      },
      { computed: { 'orders.lines.total': (line) => (line.q as number) * (line.p as number) } },
    );
    expect(lines(out.docx)).toEqual(['A: 10 3 ']);
  });

  it('does not change the data it was given', () => {
    const data = invoiceData();
    render(invoice(), data, { computed: invoiceComputed });
    expect(data.items[0]).toEqual({ name: 'Design sprint', qty: 2, price: 1800 });
  });
});

describe('dates', () => {
  it('takes a Date as a value, written as its format says', () => {
    const out = render(template('Signed on {{signed | date}}'), { signed: new Date('2026-10-24T12:00:00Z') }, { locale: 'en-US' });
    expect(out.problems).toEqual([]);
    expect(lines(out.docx)[0]).toMatch(/2026/);
  });
});

describe('check', () => {
  it('says what is missing and what a format cannot write, before anything is made', () => {
    const doc = template('{{name}} owes {{amount | currency}} by {{due | date}}', '{{note | sparkle}}');
    const result = check(doc, { amount: 'a lot', due: '2026-11-01', note: 'x' });
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(['name']);
    expect(result.problems).toEqual([
      { name: 'amount', format: 'currency', kind: 'value' },
      { name: 'note', format: 'sparkle', kind: 'format' },
    ]);
  });

  it('says a value missing inside an object the data does not have, as render does', () => {
    expect(check(template('{{client.name}} of {{client.city}}'), {}).missing).toEqual(['client.name', 'client.city']);
  });

  it('is happy with the invoice and its computed values', () => {
    expect(check(invoice(), invoiceData(), { computed: invoiceComputed })).toEqual({ ok: true, missing: [], problems: [] });
  });
});

describe('inspect', () => {
  it('lists the variables with their formats and blocks, and which are computed', () => {
    const found = inspect(invoice(), { computed: invoiceComputed });
    expect(found.variables.map((v) => [v.name, v.formats.join(','), v.block ?? '', v.computed])).toEqual([
      ['number', '', '', false],
      ['client.name', '', '', false],
      ['client.city', '', '', false],
      ['date', '', '', false],
      ['due_days', '', '', false],
      ['items.name', '', 'items', false],
      ['items.qty', '', 'items', false],
      ['items.price', 'currency', 'items', false],
      ['items.amount', 'currency', 'items', true],
      ['total', 'currency', '', true],
    ]);
    expect(found.blocks).toEqual([
      { name: 'paid', inverted: false, kind: 'text' },
      { name: 'items', inverted: false, kind: 'row' },
    ]);
  });
});

describe('a template read once', () => {
  it('fills many times from the same reading, each fill apart', () => {
    const once = loadTemplate(template('Hello {{name}}'));
    expect(docText(fill(once, { name: 'Ana' }).doc)).toBe('Hello Ana');
    expect(docText(fill(once, { name: 'Luis' }).doc)).toBe('Hello Luis');
    expect(docText(once.doc)).toBe('Hello {{name}}');
  });
});
