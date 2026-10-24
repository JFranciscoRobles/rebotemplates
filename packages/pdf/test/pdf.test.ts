import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatValue } from '@rebodocs/core';
import { badge, pixel } from '../../../test-templates/badge';
import { invoice, invoiceComputed, invoiceData } from '../../../test-templates/invoice';
import { SYSTEM_FONTS, toPdf } from '../src';

// The PDF needs fonts; a machine without any in the usual folders skips these.
const fonts = SYSTEM_FONTS.some((dir) => existsSync(dir));

describe.skipIf(!fonts)('the invoice as a PDF', () => {
  it('is a PDF, with the values the data lacked said', () => {
    const out = toPdf(invoice(), { ...invoiceData(), client: { name: 'Northwind S.A.' } }, { computed: invoiceComputed, title: 'Invoice 0144', locale: 'en-US' });
    expect(new TextDecoder().decode(out.pdf.slice(0, 5))).toBe('%PDF-');
    expect(out.pdf.length).toBeGreaterThan(1000);
    expect(out.missing).toEqual(['client.city']);
  });

  it('says the families no font was found for', () => {
    const out = toPdf(invoice(), invoiceData(), { computed: invoiceComputed, systemFonts: false });
    expect(out.missingFonts.length).toBeGreaterThan(0);
  });
});

describe.skipIf(!fonts || !formatValue('x', ['image']).problems.every((problem) => problem.kind !== 'format'))('pictures in the PDF', () => {
  it('draws the logo and the photos, given as bytes', () => {
    const out = toPdf(badge(), { team: 'Design', logo: pixel('orange'), people: [{ name: 'Ana', role: 'Lead', photo: pixel('green') }] });
    expect(out.problems).toEqual([]);
    const text = new TextDecoder('latin1').decode(out.pdf);
    expect(text.match(/\/Subtype\s*\/Image/g)?.length).toBe(2);
  });
});
