// A template as Word writes it, with its variables cut into runs: the risk a
// template made in code never meets.

import { describe, expect, it } from 'vitest';
import { docText, importDocx } from '@rebodocs/core';
import { inspect, render } from '../packages/core/src';
import { wordData, wordTemplate } from './word';

const textOf = (docx: Uint8Array) => docText(importDocx(docx)).split('\n');

describe('a template as Word writes it', () => {
  it('finds the variables and blocks cut into runs', () => {
    const found = inspect(wordTemplate());
    expect(found.variables.map((v) => [v.name, v.formats.join(',')])).toEqual([
      ['client.name', ''],
      ['total', 'currency'],
      ['items.name', ''],
      ['items.price', 'currency'],
    ]);
    expect(found.blocks.map((b) => [b.name, b.kind])).toEqual([
      ['paid', 'text'],
      ['items', 'row'],
    ]);
  });

  it('fills them, whatever the runs, the marks and the bookmark between', () => {
    const out = render(wordTemplate(), wordData(), { locale: 'en-US', currency: 'USD' });
    expect(out.missing).toEqual([]);
    expect(textOf(out.docx)).toEqual(['Dear Northwind S.A.,', 'Total: $4,818.00', 'PAID', 'Design sprint', '$3,600.00', 'Translations', '$630.00', '']);
  });
});
