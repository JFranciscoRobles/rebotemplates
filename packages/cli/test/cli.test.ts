import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { docText, formatValue, importDocx } from '@rebodocs/core';
import { badge, pixel } from '../../../test-templates/badge';
import { invoice, invoiceData } from '../../../test-templates/invoice';
import { nameFor, run } from '../src/main';

let dir = '';
const at = (name: string) => join(dir, name);
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'rebotemplates-cli-'));
  await writeFile(at('invoice.docx'), invoice());
  await writeFile(at('data.json'), JSON.stringify(invoiceData()));
  await writeFile(at('computed.mjs'), `export default { 'items.amount': (item) => item.qty * item.price, total: (_, data) => data.items.reduce((s, i) => s + i.qty * i.price, 0) };`);
});
afterAll(() => rm(dir, { recursive: true, force: true }));

describe('the command line', () => {
  it('says what a template asks for', async () => {
    const answer = await run(['inspect', at('invoice.docx')]);
    expect(answer.code).toBe(0);
    expect(answer.out).toContain('{{items.price | currency}}   in each items');
    expect(answer.out).toContain('{{#items}}   repeats a row of a table');
  });

  it('checks the data, and fails when something is missing', async () => {
    const missing = await run(['check', at('invoice.docx'), at('data.json')]);
    expect(missing.code).toBe(1);
    expect(missing.out).toContain('missing items[0].amount');
    const ok = await run(['check', at('invoice.docx'), at('data.json'), '--computed', at('computed.mjs')]);
    expect(ok).toMatchObject({ code: 0, out: 'Everything the template asks for is there.' });
  });

  it('renders a DOCX, with data from stdin', async () => {
    const answer = await run(['render', at('invoice.docx'), '-', '-o', at('out.docx'), '--computed', at('computed.mjs'), '--locale', 'en-US'], () => JSON.stringify(invoiceData()));
    expect(answer.code).toBe(0);
    expect(docText(importDocx(new Uint8Array(await readFile(at('out.docx')))))).toContain('$4,818.00');
  });

  it('renders one document per line of a JSON lines file, named by its fields', async () => {
    const lines = ['0145', '0146'].map((number) => JSON.stringify({ ...invoiceData(), number })).join('\n');
    await writeFile(at('many.jsonl'), lines);
    const answer = await run(['render', at('invoice.docx'), at('many.jsonl'), '-o', at('batch/{number}.docx'), '--computed', at('computed.mjs')]);
    expect(answer.code).toBe(0);
    expect((await readdir(at('batch'))).sort()).toEqual(['0145.docx', '0146.docx']);
  });

  it('writes nothing with --strict when a value is missing', async () => {
    const answer = await run(['render', at('invoice.docx'), at('data.json'), '-o', at('strict.docx'), '--strict']);
    expect(answer.code).toBe(1);
    expect(answer.out).toContain('not written');
  });

  it('names files with the fields of each document, and nothing a file system refuses', () => {
    expect(nameFor('out/{client.name}-{number}.pdf', { number: 7, client: { name: 'A/B' } })).toBe('out/A-B-7.pdf');
  });
});

describe.skipIf(!formatValue('x', ['image']).problems.every((problem) => problem.kind !== 'format'))('pictures from the command line', () => {
  it('reads a picture by its path, from the folder of the data, and says one that is not a picture', async () => {
    await writeFile(at('logo.png'), pixel('orange'));
    await writeFile(at('photo.png'), pixel('green'));
    await writeFile(at('badge.docx'), badge());
    await writeFile(at('team.json'), JSON.stringify({ team: 'Design', logo: 'logo.png', people: [{ name: 'Ana', role: 'Lead', photo: 'photo.png' }] }));
    expect(await run(['check', at('badge.docx'), at('team.json')])).toMatchObject({ code: 0 });
    const made = await run(['render', at('badge.docx'), at('team.json'), '-o', at('badge-out.docx')]);
    expect(made.code).toBe(0);
    expect(Object.keys(importDocx(new Uint8Array(await readFile(at('badge-out.docx')))).header!.paragraphs[0].runs.filter((r) => r.props.object))).toHaveLength(1);
    await writeFile(at('wrong.json'), JSON.stringify({ team: 'Design', logo: 'nowhere.png', people: [] }));
    const wrong = await run(['check', at('badge.docx'), at('wrong.json')]);
    expect(wrong.out).toContain('logo is not a picture');
  });
});
