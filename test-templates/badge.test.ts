// Pictures in a template: the logo in the header and a photo for each person.
// They need a Rebodocs whose templates take pictures, 0.11 on; the check below
// skips them on an older one, as on a checkout tried before it is published.

import { describe, expect, it } from 'vitest';
import { type Doc, docText, formatValue, importDocx } from '@rebodocs/core';
import { check, fetchPictures, inspect, render, resolvePictures } from '../packages/core/src';
import { badge, pixel } from './badge';

const takesPictures = formatValue('x', ['image']).problems.every((problem) => problem.kind !== 'format');
const pictures = (doc: Pick<Doc, 'paragraphs'>) => doc.paragraphs.flatMap((p) => p.runs.filter((run) => run.props.object).map((run) => Math.round(run.props.objectWidth ?? 0)));
const data = () => ({
  team: 'Design',
  logo: pixel('orange'),
  people: [
    { name: 'Ana Ruiz', role: 'Lead', photo: pixel('green') },
    { name: 'Luis Mora', role: 'Engineer', photo: pixel('orange') },
  ],
});

describe('which variables are pictures', () => {
  it('says so in inspect, and loads them from bytes, paths or addresses', async () => {
    const found = inspect(badge());
    expect(found.variables.filter((v) => v.picture).map((v) => v.name)).toEqual(['people.photo', 'logo']);
    const read = resolvePictures(badge(), { logo: 'logo.png', people: [{ photo: pixel('green') }] }, (path) => (path === 'logo.png' ? pixel('orange') : undefined));
    expect(read.logo).toMatch(/^data:image\/png;base64,/);
    expect((read.people as { photo: string }[])[0].photo).toMatch(/^data:image\/png;base64,/);
    const fetched = await fetchPictures(badge(), { logo: 'https://acme.test/logo.png' }, { fetch: async () => new Response(pixel('orange')) });
    expect(fetched.logo).toBe(read.logo);
  });
});

describe.skipIf(!takesPictures)('pictures in the document', () => {
  it('puts the logo in the header and a photo in each row, from their bytes', () => {
    const out = render(badge(), data());
    expect(out.missing).toEqual([]);
    expect(out.problems).toEqual([]);
    const doc = importDocx(out.docx);
    expect(pictures(doc.header!)).toEqual([85]);
    expect(pictures(doc)).toEqual([57, 57]);
    expect(docText(doc)).toContain('Ana Ruiz, Lead');
  });

  it('says a picture that is not one before anything is made', () => {
    const result = check(badge(), { ...data(), logo: 'https://acme.test/logo.png' });
    expect(result.problems).toEqual([{ name: 'logo', format: 'image: 3cm', kind: 'value' }]);
  });
});
