// The tools an assistant is given: a folder of templates to list, inspect,
// check data against and render, and finished documents to turn into
// templates. Every path is inside the folders the server was started with;
// nothing is read or written outside them, and no file is written over
// unless asked.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { exportDocx, importDocx } from '@rebodocs/core';
import { type Inspection, type Missing, type Template, check, inspect, loadTemplate, render, resolvePictures } from '@rebotemplates/core';
import { toPdf } from '@rebotemplates/pdf';
import { type ConditionMark, type ListMark, type RowMark, type VariableMark, markTemplate, templateText } from './make';

export interface Context {
  /** The folder of templates; relative paths start here. */
  dir: string;
  /** Other folders documents may be written to. */
  out: string[];
  /** Folders of fonts for PDFs, before the system's. */
  fonts: string[];
}

/** What the assistant can put right: said to it as the result of the tool. */
export class ToolError extends Error {}

type Args = Record<string, unknown>;

export interface Tool {
  name: string;
  title: string;
  description: string;
  properties: Record<string, unknown>;
  required?: string[];
  annotations: { readOnlyHint: boolean; destructiveHint?: boolean; idempotentHint?: boolean };
  run(context: Context, args: Args): string;
}

const text = (args: Args, name: string): string => {
  const value = args[name];
  if (typeof value !== 'string' || !value.trim()) throw new ToolError(`Give ${name}.`);
  return value.trim();
};
const optional = (args: Args, name: string): string | undefined => (typeof args[name] === 'string' && (args[name] as string).trim() ? (args[name] as string).trim() : undefined);
const object = (args: Args, name: string): Record<string, unknown> => {
  const value = args[name];
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ToolError(`Give ${name} as an object.`);
  return value as Record<string, unknown>;
};

/** A path inside the folders allowed, with one of the extensions asked for. */
function pathIn(context: Context, given: string, extensions: string[]): string {
  const path = isAbsolute(given) ? resolve(given) : resolve(context.dir, given);
  const inside = [context.dir, ...context.out].some((root) => path === root || path.startsWith(root + sep));
  if (!inside) throw new ToolError(`${given} is outside the folders this server may use: ${[context.dir, ...context.out].join(', ')}.`);
  if (!extensions.includes(extname(path).toLowerCase())) throw new ToolError(`${given} should end in ${extensions.join(' or ')}.`);
  return path;
}

const shown = (context: Context, path: string) => relative(context.dir, path) || path;

function readTemplate(context: Context, given: string) {
  const path = pathIn(context, given, ['.docx']);
  if (!existsSync(path)) throw new ToolError(`There is no ${given}. list_templates lists the templates there are.`);
  return loadTemplate(new Uint8Array(readFileSync(path)));
}

/** Every .docx under a folder, as paths from it. */
function templatesIn(dir: string): string[] {
  const out: string[] = [];
  const walk = (at: string) => {
    for (const name of readdirSync(at)) {
      if (name.startsWith('.') || name === 'node_modules') continue;
      const path = resolve(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.docx$/i.test(name) && !name.startsWith('~$')) out.push(relative(dir, path));
    }
  };
  walk(dir);
  return out.sort();
}

/** The data with its pictures read from the folders: a path to a PNG, a JPEG or a GIF inside them. Addresses on the web are not fetched. */
function withPictures(context: Context, template: Template, data: Record<string, unknown>): Record<string, unknown> {
  return resolvePictures(template, data, (value) => {
    if (!/\.(png|jpe?g|gif)$/i.test(value)) return undefined;
    try {
      const path = pathIn(context, value, ['.png', '.jpg', '.jpeg', '.gif']);
      return existsSync(path) ? new Uint8Array(readFileSync(path)) : undefined;
    } catch {
      return undefined;
    }
  });
}

/** A problem as an assistant reads it; a picture that is not one, with what a picture may be given as. */
const problemText = (problem: { name: string; format: string; kind: string }, template: Template) =>
  problem.kind === 'format'
    ? `No format "${problem.format}" (in {{${problem.name}}})`
    : template.pictures.includes(problem.name)
      ? `${problem.name} is not a picture: give the path of a PNG, a JPEG or a GIF in the folder, or a data: address`
      : `${problem.name} cannot be written as ${problem.format}`;

/** Data of the shape a template asks for, to fill in: what an assistant sends render_document. */
export function exampleData(found: Inspection): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const lists = new Set(found.blocks.filter((block) => found.variables.some((v) => v.name.startsWith(`${block.name}.`))).map((block) => block.name));
  const place = (path: string, value: unknown) => {
    let at: Record<string, unknown> = data;
    const steps = path.split('.');
    steps.forEach((step, i) => {
      const sofar = steps.slice(0, i + 1).join('.');
      if (i === steps.length - 1) {
        at[step] ??= value;
        return;
      }
      if (lists.has(sofar)) {
        const list = (at[step] ??= [{}]) as Record<string, unknown>[];
        at = list[0];
      } else at = (at[step] ??= {}) as Record<string, unknown>;
    });
  };
  for (const block of found.blocks) if (!lists.has(block.name)) place(block.name, true);
  for (const variable of found.variables) {
    if (variable.computed) continue;
    const kind = variable.formats.join(' ');
    place(variable.name, variable.picture ? 'path/to/picture.png' : /currency|number|moneda|número/.test(kind) ? 0 : /date|fecha/.test(kind) ? 'YYYY-MM-DD' : 'text');
  }
  return data;
}

const DATA = {
  type: 'object',
  description:
    'The values, by the names the template uses: { "client": { "name": "Ana" } } fills {{client.name}}; a list fills a block, each item an object whose fields fill {{items.name}}; true or false keeps a block or leaves it out. Dates as YYYY-MM-DD, numbers plain (1234.5): the formats write them out. A picture ({{logo | image}}) as the path of a PNG, a JPEG or a GIF in the folder. inspect_template gives data of the right shape to fill in.',
  additionalProperties: true,
};
const FORMATS = {
  locale: { type: 'string', description: 'The language numbers, dates and money are written in: "en-US", "es-MX". The template’s own when left out.' },
  currency: { type: 'string', description: 'The currency of | currency: "USD", "EUR", "MXN".' },
};

export const TOOLS: Tool[] = [
  {
    name: 'list_templates',
    title: 'List templates',
    description: 'The Word templates (.docx) in the folder, each with how many variables and blocks it has.',
    properties: {},
    annotations: { readOnlyHint: true },
    run(context) {
      const found = templatesIn(context.dir);
      if (!found.length) return `No .docx in ${context.dir}. make_template turns a finished .docx into one.`;
      return found
        .map((path) => {
          try {
            const { variables, blocks } = inspect(loadTemplate(new Uint8Array(readFileSync(resolve(context.dir, path)))));
            return `${path} — ${variables.length} variable${variables.length === 1 ? '' : 's'}, ${blocks.length} block${blocks.length === 1 ? '' : 's'}`;
          } catch {
            return `${path} — could not be read as a Word file`;
          }
        })
        .join('\n');
    },
  },
  {
    name: 'inspect_template',
    title: 'Inspect a template',
    description: 'What a template asks for: its variables with their formats, its blocks (what repeats, what is kept or left out), and data of the right shape to fill in for render_document.',
    properties: { template: { type: 'string', description: 'The path of the template, from the folder: "invoice.docx".' } },
    required: ['template'],
    annotations: { readOnlyHint: true },
    run(context, args) {
      const found = inspect(readTemplate(context, text(args, 'template')));
      const KIND = { text: 'some text', row: 'a row of a table', paragraphs: 'paragraphs' };
      return [
        'Variables:',
        ...found.variables.map(
          (v) => `  {{${[v.name, ...v.formats].join(' | ')}}}${v.picture ? ' — a picture' : ''}${v.block ? ` — a field of each item of ${v.block}` : ''}${v.uses > 1 ? ` — used ${v.uses}×` : ''}`,
        ),
        ...(found.blocks.length
          ? [
              'Blocks:',
              ...found.blocks.map(
                (b) => `  {{${b.inverted ? '^' : '#'}${b.name}}} — ${KIND[b.kind]}, ${b.inverted ? 'kept when the value is not there' : 'repeated for each item of a list, or kept for true'}`,
              ),
            ]
          : []),
        'Data to fill in:',
        JSON.stringify(exampleData(found), null, 2),
      ].join('\n');
    },
  },
  {
    name: 'check_data',
    title: 'Check data against a template',
    description: 'What would go wrong rendering a template with this data, before anything is made: values missing, and values a format cannot write (text where a date goes).',
    properties: { template: { type: 'string', description: 'The path of the template.' }, data: DATA, ...FORMATS },
    required: ['template', 'data'],
    annotations: { readOnlyHint: true },
    run(context, args) {
      const template = readTemplate(context, text(args, 'template'));
      const result = check(template, withPictures(context, template, object(args, 'data')), { locale: optional(args, 'locale'), currency: optional(args, 'currency') });
      if (result.ok) return 'Everything the template asks for is there.';
      return [...result.missing.map((path) => `Missing: ${path}`), ...result.problems.map((p) => problemText(p, template))].join('\n');
    },
  },
  {
    name: 'render_document',
    title: 'Render a document',
    description:
      'Fills a template with data and writes the document, a .docx or a PDF by the extension of output, in the folder. A value missing is marked [path] in it and said; check_data first to avoid that. An existing file is written over only with overwrite.',
    properties: {
      template: { type: 'string', description: 'The path of the template.' },
      data: DATA,
      output: { type: 'string', description: 'Where to write it, from the folder: "out/invoice-0144.pdf".' },
      ...FORMATS,
      missing: { type: 'string', enum: ['mark', 'empty', 'keep'], description: 'A value missing: marked [path] (the default), left empty, or the {{variable}} kept.' },
      overwrite: { type: 'boolean', description: 'Write over a file already there.' },
    },
    required: ['template', 'data', 'output'],
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    run(context, args) {
      const template = readTemplate(context, text(args, 'template'));
      const output = pathIn(context, text(args, 'output'), ['.docx', '.pdf']);
      if (existsSync(output) && args.overwrite !== true) throw new ToolError(`${shown(context, output)} is there already. Give another output, or overwrite: true.`);
      const options = { locale: optional(args, 'locale'), currency: optional(args, 'currency'), missing: (optional(args, 'missing') ?? 'mark') as Missing };
      const data = withPictures(context, template, object(args, 'data'));
      const made = extname(output).toLowerCase() === '.pdf' ? toPdf(template, data, { ...options, fonts: context.fonts }) : render(template, data, options);
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, 'pdf' in made ? made.pdf : made.docx);
      return [
        `Written: ${shown(context, output)}.`,
        ...(made.missing.length ? [`Missing, marked in it: ${made.missing.join(', ')}.`] : []),
        ...made.problems.map((p) => `${problemText(p, template)}.`),
        ...('missingFonts' in made && made.missingFonts.length ? [`No font found for ${made.missingFonts.join(', ')}: another was used.`] : []),
      ].join('\n');
    },
  },
  {
    name: 'make_template',
    title: 'Turn a document into a template',
    description:
      'Turns a finished .docx (an invoice, a contract) into a template, written as a new file; the document itself is not changed. Each change is found by its exact text: texts that become {{variables}}, a row of a table or paragraphs that repeat for each item of a list (the other items taken out), and paragraphs or text kept only when a value is there. Read the document first and propose the changes to the person; with dry_run, nothing is written and the template is shown.',
    properties: {
      source: { type: 'string', description: 'The finished document, from the folder: "invoice-0142.docx".' },
      output: { type: 'string', description: 'The template to write, from the folder: "invoice.docx".' },
      variables: {
        type: 'array',
        description: 'Texts that become variables, each everywhere it is unless first.',
        items: {
          type: 'object',
          properties: {
            find: { type: 'string', description: 'The text exactly as it reads: "Northwind S.A.".' },
            variable: { type: 'string', description: 'The variable: "client.name".' },
            format: { type: 'string', description: 'A format: "currency", "long date", "upper".' },
            first: { type: 'boolean', description: 'Only where it first appears.' },
            in: { type: 'string', description: 'A longer text it is inside, to tell it from the same text elsewhere: "3" in "for 3 years".' },
          },
          required: ['find', 'variable'],
        },
      },
      rows: {
        type: 'array',
        description: 'Rows of tables that become one row repeated for each item of a list.',
        items: {
          type: 'object',
          properties: {
            find: { type: 'string', description: 'A text in the row to keep and repeat: "Design sprint".' },
            list: { type: 'string', description: 'The list: "items".' },
            fields: {
              type: 'array',
              description: 'Texts of that row that become fields of each item.',
              items: {
                type: 'object',
                properties: { find: { type: 'string' }, field: { type: 'string', description: '"name", "qty", "price".' }, format: { type: 'string' } },
                required: ['find', 'field'],
              },
            },
            remove: { type: 'array', items: { type: 'string' }, description: 'A text in each other row of the table that was an item too, to take it out.' },
          },
          required: ['find', 'list', 'fields'],
        },
      },
      lists: {
        type: 'array',
        description: 'Paragraphs that become the ones repeated for each item of a list: a list of deliverables, of clauses.',
        items: {
          type: 'object',
          properties: {
            find: { type: 'string', description: 'A text in the (first) paragraph of the item to keep and repeat: "A brand guide".' },
            to: { type: 'string', description: 'A text in its last paragraph, when an item is several.' },
            list: { type: 'string', description: 'The list: "deliverables".' },
            fields: {
              type: 'array',
              description: 'Texts of those paragraphs that become fields of each item.',
              items: {
                type: 'object',
                properties: { find: { type: 'string' }, field: { type: 'string', description: '"name", "due".' }, format: { type: 'string' } },
                required: ['find', 'field'],
              },
            },
            remove: { type: 'array', items: { type: 'string' }, description: 'A text in each paragraph of the other items, to take them out.' },
          },
          required: ['find', 'list', 'fields'],
        },
      },
      conditions: {
        type: 'array',
        description: 'Paragraphs, or a text inside one, kept only when a value is there (or, with unless, when it is not).',
        items: {
          type: 'object',
          properties: {
            find: { type: 'string', description: 'A text in the paragraph: "PAID"; with inline, the text itself: " each month".' },
            when: { type: 'string', description: 'The value: "paid".' },
            unless: { type: 'boolean', description: 'Kept when the value is not there.' },
            to: { type: 'string', description: 'A text in the last paragraph, when what depends on the value is several: a clause with its heading.' },
            inline: { type: 'boolean', description: 'Only the text found, inside its paragraph.' },
          },
          required: ['find', 'when'],
        },
      },
      dry_run: { type: 'boolean', description: 'Write nothing; show the template that would be written.' },
      overwrite: { type: 'boolean', description: 'Write over a template already there.' },
    },
    required: ['source', 'output'],
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    run(context, args) {
      const source = pathIn(context, text(args, 'source'), ['.docx']);
      const output = pathIn(context, text(args, 'output'), ['.docx']);
      if (!existsSync(source)) throw new ToolError(`There is no ${text(args, 'source')}.`);
      if (output === source) throw new ToolError('The template is written as a new file: give an output other than the source.');
      const dry = args.dry_run === true;
      if (!dry && existsSync(output) && args.overwrite !== true) throw new ToolError(`${shown(context, output)} is there already. Give another output, or overwrite: true.`);
      const list = <T>(name: string) => (Array.isArray(args[name]) ? (args[name] as T[]) : []);
      const made = markTemplate(importDocx(new Uint8Array(readFileSync(source))), {
        variables: list<VariableMark>('variables'),
        rows: list<RowMark>('rows'),
        lists: list<ListMark>('lists'),
        conditions: list<ConditionMark>('conditions'),
      });
      if (!made.done.length) throw new ToolError(['Nothing was found to change.', ...made.missed].join('\n'));
      const bytes = exportDocx(made.doc);
      if (!dry) {
        mkdirSync(dirname(output), { recursive: true });
        writeFileSync(output, bytes);
      }
      const found = inspect(loadTemplate(bytes));
      return [
        dry ? `Not written (dry_run). As ${shown(context, output)} it would read:` : `Written: ${shown(context, output)}, from ${shown(context, source)}, which is unchanged.`,
        'Changes:',
        ...made.done.map((line) => `  ${line}`),
        ...(made.missed.length ? ['Not found:', ...made.missed.map((line) => `  ${line}`)] : []),
        `It asks for ${found.variables.length} variables and has ${found.blocks.length} blocks.`,
        'The template:',
        templateText(made.doc),
      ].join('\n');
    },
  },
];

export const findTool = (name: string) => TOOLS.find((tool) => tool.name === name);
