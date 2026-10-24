// The contract and the letter rendered, and their text read back from the
// DOCX made: what a person opening the file in Word would see.

import { describe, expect, it } from 'vitest';
import { docText, importDocx } from '@rebodocs/core';
import { check, inspect, render } from '../packages/core/src';
import { contract, contractData } from './contract';
import { letter, letterData } from './letter';

const textOf = (docx: Uint8Array) => docText(importDocx(docx)).split('\n');

describe('the contract', () => {
  it('keeps the clauses the data asks for, repeats the deliverables, and writes the names and dates as formatted', () => {
    const out = render(contract(), contractData(), { locale: 'en-US', currency: 'USD' });
    expect(out.missing).toEqual([]);
    expect(out.problems).toEqual([]);
    expect(textOf(out.docx)).toEqual([
      'Service agreement',
      'Between ACME LTD. and STUDIO LUMEN, signed on October 24, 2026.',
      '1. Services',
      'The provider will deliver:',
      '– A brand guide, by November 15, 2026.',
      '– Templates for invoices and letters, by December 1, 2026.',
      '2. Payment',
      'The client will pay $1,180.00 each month.',
      '3. Confidentiality',
      'Each party keeps the other’s information confidential for 3 years after the end of this agreement.',
      'The client may hire other providers for these services.',
    ]);
  });

  it('takes out a clause whose value is false, and writes the other version of one in two', () => {
    const data = { ...contractData(), monthly: false, confidential: false, exclusive: true };
    const text = textOf(render(contract(), data, { locale: 'en-US' }).docx);
    expect(text).toContain('The client will pay $1,180.00.');
    expect(text).not.toContain('3. Confidentiality');
    expect(text).toContain('The client may not hire another provider for these services while this agreement lasts.');
    expect(text).not.toContain('The client may hire other providers for these services.');
  });

  it('says which blocks are clauses and which repeat', () => {
    expect(inspect(contract()).blocks).toEqual([
      { name: 'deliverables', inverted: false, kind: 'paragraphs' },
      { name: 'monthly', inverted: false, kind: 'text' },
      { name: 'confidential', inverted: false, kind: 'paragraphs' },
      { name: 'exclusive', inverted: false, kind: 'paragraphs' },
      { name: 'exclusive', inverted: true, kind: 'paragraphs' },
    ]);
  });

  it('says a date that is not one, before anything is made', () => {
    const data = { ...contractData(), signed: 'soon' };
    expect(check(contract(), data).problems).toEqual([{ name: 'signed', format: 'long date', kind: 'value' }]);
  });
});

describe('the letter, written in Spanish', () => {
  it('reads its formats by their Spanish names and writes dates in the language asked', () => {
    const out = render(letter(), letterData(), { locale: 'es-MX' });
    expect(out.problems).toEqual([]);
    expect(textOf(out.docx)).toEqual([
      'Monterrey, 24 de octubre de 2026',
      'Estimada Ana Ruiz:',
      'Le confirmamos su cita del 03/11/2026 a nombre de ANA RUIZ.',
      'P. D. Traiga una identificación.',
      'Atentamente, Acme Ltd.',
    ]);
  });

  it('leaves the postscript out when there is none', () => {
    const { ps: _, ...data } = letterData();
    const out = render(letter(), data, { locale: 'es-MX' });
    expect(textOf(out.docx)[3]).toBe('');
    // Not named at all: said, in case it was forgotten.
    expect(out.missing).toEqual(['ps']);
    // Named as none: meant.
    expect(render(letter(), { ...data, ps: null }, { locale: 'es-MX' }).missing).toEqual([]);
  });
});
