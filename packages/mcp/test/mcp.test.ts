import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { docText, importDocx } from '@rebodocs/core';
import { render } from '@rebotemplates/core';
import { formatValue } from '@rebodocs/core';
import { badge, pixel } from '../../../test-templates/badge';
import { contract, contractData } from '../../../test-templates/contract';
import { invoice, invoiceComputed, invoiceData } from '../../../test-templates/invoice';
import { type Message, createTemplateServer } from '../src/server';

let dir = '';
let server: ReturnType<typeof createTemplateServer>;
let next = 0;
const textOf = (bytes: Uint8Array) => docText(importDocx(bytes));

/** A tool called as a client calls it: its text, and whether it is an error. */
async function call(name: string, args: Record<string, unknown>) {
  const answer = (await server.handle({ jsonrpc: '2.0', id: ++next, method: 'tools/call', params: { name, arguments: args } })) as {
    result: { content: { text: string }[]; isError?: boolean };
  };
  return { text: answer.result.content[0].text, error: Boolean(answer.result.isError) };
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rebotemplates-mcp-'));
  writeFileSync(join(dir, 'invoice.docx'), invoice());
  // A finished invoice, as a person has one before there is a template: no variables in it.
  const finished = render(invoice(), { ...invoiceData(), number: '0142', paid: true }, { computed: invoiceComputed, locale: 'en-US', currency: 'USD' });
  writeFileSync(join(dir, 'invoice-0142.docx'), finished.docx);
  writeFileSync(join(dir, 'contract-lumen.docx'), render(contract(), contractData(), { locale: 'en-US', currency: 'USD' }).docx);
  server = createTemplateServer({ dir });
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('the protocol', () => {
  it('says what it is and lists its tools', async () => {
    const init = (await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })) as { result: Record<string, unknown> };
    expect(init.result).toMatchObject({ protocolVersion: '2025-06-18', serverInfo: { name: 'rebotemplates' }, capabilities: { tools: {} } });
    const list = (await server.handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' })) as { result: { tools: { name: string }[] } };
    expect(list.result.tools.map((tool) => tool.name)).toEqual(['list_templates', 'inspect_template', 'check_data', 'render_document', 'make_template']);
  });

  it('answers no notification, and says so of a method it does not have', async () => {
    expect(await server.handle({ jsonrpc: '2.0', method: 'notifications/initialized' } as Message)).toBeUndefined();
    expect(await server.handle({ jsonrpc: '2.0', id: 3, method: 'resources/list' })).toMatchObject({ error: { code: -32601 } });
  });
});

describe('a folder of templates', () => {
  it('lists the templates with what they ask for', async () => {
    const { text } = await call('list_templates', {});
    expect(text).toContain('invoice.docx — 10 variables, 2 blocks');
    expect(text).toContain('invoice-0142.docx — 0 variables, 0 blocks');
    expect(text).toContain('contract-lumen.docx — 0 variables, 0 blocks');
  });

  it('gives data of the shape a template asks for', async () => {
    const { text } = await call('inspect_template', { template: 'invoice.docx' });
    expect(text).toContain('{{items.price | currency}} — a field of each item of items');
    const example = JSON.parse(text.slice(text.indexOf('{', text.indexOf('Data to fill in:'))));
    expect(example).toMatchObject({ number: 'text', paid: true, client: { name: 'text', city: 'text' }, items: [{ name: 'text', price: 0, amount: 0 }], total: 0 });
  });

  it('checks data before anything is made', async () => {
    const { text } = await call('check_data', { template: 'invoice.docx', data: { number: '1' } });
    expect(text).toContain('Missing: client.name');
    expect(text).toContain('Missing: items');
  });

  it('renders a .docx and a PDF in the folder, and will not write over one', async () => {
    const data = { ...invoiceData(), items: invoiceData().items.map((item) => ({ ...item, amount: item.qty * item.price })), total: 4818 };
    const docx = await call('render_document', { template: 'invoice.docx', data, output: 'out/invoice-0144.docx', locale: 'en-US' });
    expect(docx).toEqual({ text: 'Written: out/invoice-0144.docx.', error: false });
    expect(textOf(new Uint8Array(readFileSync(join(dir, 'out/invoice-0144.docx'))))).toContain('$4,818.00');
    const pdf = await call('render_document', { template: 'invoice.docx', data, output: 'out/invoice-0144.pdf' });
    expect(pdf.text).toContain('Written: out/invoice-0144.pdf.');
    expect(readFileSync(join(dir, 'out/invoice-0144.pdf')).subarray(0, 5).toString()).toBe('%PDF-');
    expect(await call('render_document', { template: 'invoice.docx', data, output: 'out/invoice-0144.docx' })).toMatchObject({ error: true });
  });

  it('refuses a path outside its folders', async () => {
    const { text, error } = await call('render_document', { template: 'invoice.docx', data: {}, output: '../elsewhere.docx' });
    expect(error).toBe(true);
    expect(text).toContain('outside the folders');
  });
});

describe('a finished document turned into a template', () => {
  const marking = {
    source: 'invoice-0142.docx',
    output: 'made/invoice.docx',
    rows: [
      {
        find: 'Design sprint',
        list: 'items',
        fields: [
          { find: 'Design sprint', field: 'name' },
          { find: '2', field: 'qty' },
          { find: '$1,800.00', field: 'price', format: 'currency' },
          { find: '$3,600.00', field: 'amount', format: 'currency' },
        ],
        remove: ['Editor licences', 'Translations'],
      },
    ],
    conditions: [{ find: 'PAID', when: 'paid' }],
    variables: [
      { find: '0142', variable: 'number' },
      { find: 'Northwind S.A.', variable: 'client.name' },
      { find: 'Monterrey', variable: 'client.city' },
      { find: '24 Oct 2026', variable: 'date' },
      { find: '15', variable: 'due_days', first: true },
      { find: '$4,818.00', variable: 'total', format: 'currency' },
    ],
  };

  it('shows the template without writing it, with dry_run', async () => {
    const { text, error } = await call('make_template', { ...marking, dry_run: true });
    expect(error).toBe(false);
    expect(text).toContain('Not written (dry_run).');
    expect(text).toContain('{{#items}}{{items.name}}');
    expect(existsSync(join(dir, 'made/invoice.docx'))).toBe(false);
  });

  it('writes a template that makes the same documents as the one the invoice came from', async () => {
    const { text } = await call('make_template', marking);
    expect(text).toContain('which is unchanged');
    expect(text).toContain('It asks for 10 variables and has 2 blocks.');
    const made = new Uint8Array(readFileSync(join(dir, 'made/invoice.docx')));
    const data = {
      ...invoiceData(),
      number: '0150',
      paid: false,
      client: { name: 'Studio Lumen', city: 'Lima' },
      items: [
        { name: 'Audit', qty: 1, price: 900 },
        { name: 'Report', qty: 2, price: 150 },
      ],
    };
    const options = { computed: invoiceComputed, locale: 'en-US', currency: 'USD' };
    expect(textOf(render(made, data, options).docx)).toBe(textOf(render(invoice(), data, options).docx));
    // The finished invoice is as it was.
    expect(textOf(new Uint8Array(readFileSync(join(dir, 'invoice-0142.docx'))))).toContain('Northwind S.A.');
  });

  it('says what it did not find, rather than guessing', async () => {
    const { text } = await call('make_template', {
      source: 'invoice-0142.docx',
      output: 'made/other.docx',
      variables: [
        { find: 'Northwind S.A.', variable: 'client.name' },
        { find: 'Globex', variable: 'x' },
      ],
    });
    expect(text).toContain('Not found:');
    expect(text).toContain('No "Globex" in the document, for x.');
  });

  it('never writes over the document it came from', async () => {
    expect(await call('make_template', { source: 'invoice-0142.docx', output: 'invoice-0142.docx', variables: [{ find: 'Monterrey', variable: 'city' }] })).toMatchObject({ error: true });
  });
});

describe('a finished contract turned into a template', () => {
  it('repeats paragraphs for each item, keeps a clause of several paragraphs and a text inside one by a value, and tells a number from the same elsewhere', async () => {
    const { text, error } = await call('make_template', {
      source: 'contract-lumen.docx',
      output: 'made/contract.docx',
      lists: [
        {
          find: 'A brand guide',
          list: 'deliverables',
          fields: [
            { find: 'A brand guide', field: 'name' },
            { find: 'November 15, 2026', field: 'due', format: 'long date' },
          ],
          remove: ['Templates for invoices and letters'],
        },
      ],
      conditions: [
        { find: ' each month', when: 'monthly', inline: true },
        { find: '3. Confidentiality', to: 'information confidential', when: 'confidential' },
        { find: 'may hire other providers', when: 'exclusive', unless: true },
      ],
      variables: [
        { find: 'ACME LTD.', variable: 'provider.name', format: 'upper' },
        { find: 'STUDIO LUMEN', variable: 'client.name', format: 'upper' },
        { find: 'October 24, 2026', variable: 'signed', format: 'long date' },
        { find: '$1,180.00', variable: 'fee', format: 'currency' },
        { find: '3', in: 'for 3 years', variable: 'confidential.years' },
      ],
    });
    expect(error).toBe(false);
    expect(text).not.toContain('Not found:');
    const made = new Uint8Array(readFileSync(join(dir, 'made/contract.docx')));
    const options = { locale: 'en-US', currency: 'USD' };
    // Other values, the same shape: the contract the template makes is the one the original template makes.
    const data = {
      ...contractData(),
      provider: { name: 'Globex' },
      client: { name: 'Casa Rivera' },
      signed: '2027-01-10',
      fee: 2400,
      confidential: { years: 5 },
      deliverables: [
        { name: 'An audit', due: '2027-02-01' },
        { name: 'A report', due: '2027-03-01' },
        { name: 'A workshop', due: '2027-03-15' },
      ],
    };
    expect(textOf(render(made, data, options).docx)).toBe(textOf(render(contract(), data, options).docx));
    // And with the values that leave things out.
    const without = { ...data, monthly: false, confidential: false, deliverables: [] };
    expect(textOf(render(made, without, options).docx)).toBe(textOf(render(contract(), without, options).docx));
  });
});

describe.skipIf(!formatValue('x', ['image']).problems.every((problem) => problem.kind !== 'format'))('pictures through MCP', () => {
  it('reads pictures by their paths in the folder, and not outside it', async () => {
    writeFileSync(join(dir, 'badge.docx'), badge());
    writeFileSync(join(dir, 'logo.png'), pixel('orange'));
    writeFileSync(join(dir, 'ana.png'), pixel('green'));
    const inspected = await call('inspect_template', { template: 'badge.docx' });
    expect(inspected.text).toContain('{{logo | image: 3cm}} — a picture');
    expect(inspected.text).toContain('"logo": "path/to/picture.png"');
    const data = { team: 'Design', logo: 'logo.png', people: [{ name: 'Ana', role: 'Lead', photo: 'ana.png' }] };
    expect((await call('check_data', { template: 'badge.docx', data })).text).toBe('Everything the template asks for is there.');
    expect((await call('render_document', { template: 'badge.docx', data, output: 'out/badge.docx' })).text).toBe('Written: out/badge.docx.');
    const outside = await call('check_data', { template: 'badge.docx', data: { ...data, logo: '../../etc/logo.png' } });
    expect(outside.text).toContain('logo is not a picture');
  });
});
