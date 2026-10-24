// The invoice rendered, and its text read back from the DOCX made: what a
// person opening the file in Word would see.

import { describe, expect, it } from 'vitest';
import { docText, importDocx } from '@rebodocs/core';
import { render } from '../packages/core/src';
import { invoice, invoiceComputed, invoiceData } from './invoice';

const textOf = (docx: Uint8Array) => docText(importDocx(docx)).split('\n');

describe('the invoice', () => {
  it('fills the table with a row per item, the amounts and the total worked out in code', () => {
    const out = render(invoice(), invoiceData(), { computed: invoiceComputed, locale: 'en-US', currency: 'USD' });
    expect(out.missing).toEqual([]);
    expect(out.problems).toEqual([]);
    expect(textOf(out.docx)).toEqual([
      'Invoice 0144',
      'Billed to Northwind S.A., Monterrey.',
      'Date 24 Oct 2026 · due in 15 days',
      '',
      'Item',
      'Qty',
      'Price',
      'Amount',
      'Design sprint',
      '2',
      '$1,800.00',
      '$3,600.00',
      'Editor licences',
      '12',
      '$49.00',
      '$588.00',
      'Translations',
      '3',
      '$210.00',
      '$630.00',
      'Total',
      '',
      '',
      '$4,818.00',
      // The paragraph Word keeps after every table.
      '',
      'Acme Ltd. · invoice-0144.pdf',
    ]);
  });

  it('shows PAID only when it is paid', () => {
    const paid = render(invoice(), { ...invoiceData(), paid: true }, { computed: invoiceComputed });
    expect(textOf(paid.docx)[3]).toBe('PAID');
  });
});
