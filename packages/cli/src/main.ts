// The command line:
//
//   rebotemplates render template.docx data.json -o out.(docx|pdf) [--locale en-US] [--currency EUR]
//                 [--missing mark|empty|keep] [--strict] [--computed computed.mjs] [--fonts folder]
//   rebotemplates render template.docx data.jsonl -o "out/{number}.pdf"   one document per line
//   rebotemplates inspect template.docx
//   rebotemplates check template.docx data.json [--computed computed.mjs]
//
// Data comes from the file given, or from stdin with "-". `--computed` names a
// module whose default export is the `computed` of `render`. The work is a
// function that answers with the text to print and the exit code, so the
// tests run it without a process of its own.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Computed, type Missing, check, inspect, loadTemplate, render } from '@rebotemplates/core';
import { toPdf } from '@rebotemplates/pdf';

export const USAGE = `Usage:
  rebotemplates render template.docx data.json -o out.(docx|pdf) [options]
  rebotemplates render template.docx data.jsonl -o "out/{number}.pdf" [options]   one document per line
  rebotemplates inspect template.docx
  rebotemplates check template.docx data.json [--computed computed.mjs]

Options:
  --locale en-US           the language of numbers, dates and money
  --currency EUR           the currency of | currency
  --missing mark|empty|keep  what to do with a value the data lacks ([path] unless said)
  --strict                 fail when a value is missing or a format cannot write one
  --computed file.mjs      a module whose default export is the computed values
  --fonts folder           fonts for the PDF, before the system's
Data is read from stdin when its file is "-".`;

export interface Answer {
  out: string;
  err: string;
  code: number;
}

interface Parsed {
  words: string[];
  flags: Record<string, string | true>;
}

function parse(args: string[]): Parsed {
  const words: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o') flags.output = args[++i] ?? '';
    else if (arg === '--strict' || arg === '--help' || arg === '-h') flags[arg.replace(/^-+/, '')] = true;
    else if (arg.startsWith('--')) flags[arg.slice(2)] = args[++i] ?? '';
    else words.push(arg);
  }
  return { words, flags };
}

const text = (value: string | true | undefined) => (typeof value === 'string' && value ? value : undefined);

/** `out/{number}.pdf` with the values of one document: a field per brace, dotted for nested ones. */
export function nameFor(pattern: string, data: Record<string, unknown>): string {
  return pattern.replace(/\{([\w.]+)\}/g, (_, path: string) => {
    const value = path.split('.').reduce<unknown>((at, step) => (at && typeof at === 'object' ? (at as Record<string, unknown>)[step] : undefined), data);
    return String(value ?? '').replace(/[/\\:*?"<>|]/g, '-') || 'untitled';
  });
}

export async function run(args: string[], stdin: () => string = () => readFileSync(0, 'utf8')): Promise<Answer> {
  const { words, flags } = parse(args);
  const [command, templatePath, dataPath] = words;
  if (flags.help || !command) return { out: USAGE, err: '', code: command ? 0 : 1 };
  if (!templatePath) return { out: '', err: USAGE, code: 1 };

  const template = loadTemplate(new Uint8Array(readFileSync(templatePath)));
  const computed = text(flags.computed) ? ((await import(pathToFileURL(resolve(text(flags.computed)!)).href)).default as Record<string, Computed>) : undefined;
  const options = { computed, locale: text(flags.locale), currency: text(flags.currency) };

  if (command === 'inspect') {
    const found = inspect(template, { computed });
    const lines = [
      ...found.variables.map((v) => `{{${[v.name, ...v.formats].join(' | ')}}}${v.block ? `   in each ${v.block}` : ''}${v.computed ? '   computed' : ''}${v.uses > 1 ? `   ×${v.uses}` : ''}`),
      ...found.blocks.map(
        (b) => `{{${b.inverted ? '^' : '#'}${b.name}}}   ${b.kind === 'row' ? 'repeats a row of a table' : b.kind === 'paragraphs' ? 'repeats or keeps paragraphs' : 'repeats or keeps text'}`,
      ),
    ];
    return { out: lines.join('\n'), err: '', code: 0 };
  }

  if (!dataPath) return { out: '', err: USAGE, code: 1 };
  const raw = dataPath === '-' ? stdin() : readFileSync(dataPath, 'utf8');
  const many = extname(dataPath) === '.jsonl';
  let records: Record<string, unknown>[];
  try {
    records = many
      ? raw
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => JSON.parse(line))
      : [JSON.parse(raw)];
  } catch (error) {
    return { out: '', err: `The data is not JSON: ${(error as Error).message}`, code: 1 };
  }

  if (command === 'check') {
    const lines: string[] = [];
    let ok = true;
    records.forEach((data, i) => {
      const result = check(template, data, options);
      ok &&= result.ok;
      const where = many ? `line ${i + 1}: ` : '';
      for (const path of result.missing) lines.push(`${where}missing ${path}`);
      for (const problem of result.problems) lines.push(`${where}${problem.kind === 'format' ? `no format "${problem.format}"` : `${problem.name} cannot be written as ${problem.format}`}`);
    });
    return { out: ok ? 'Everything the template asks for is there.' : lines.join('\n'), err: '', code: ok ? 0 : 1 };
  }

  if (command !== 'render') return { out: '', err: `No command "${command}".\n${USAGE}`, code: 1 };
  const output = text(flags.output);
  if (!output) return { out: '', err: 'Say where to write it: -o out.pdf', code: 1 };
  if (many && !/\{[\w.]+\}/.test(output)) return { out: '', err: 'One document per line needs a name with a field in it: -o "out/{number}.pdf"', code: 1 };
  const missing = (text(flags.missing) ?? 'mark') as Missing;
  const fonts = text(flags.fonts) ? [text(flags.fonts)!] : undefined;

  const said: string[] = [];
  let failed = false;
  for (const data of records) {
    const file = many ? nameFor(output, data) : output;
    const made = extname(file).toLowerCase() === '.pdf' ? toPdf(template, data, { ...options, missing, fonts }) : render(template, data, { ...options, missing });
    if (flags.strict && (made.missing.length || made.problems.length)) {
      failed = true;
      said.push(`${file}: not written, ${[...made.missing.map((m) => `missing ${m}`), ...made.problems.map((p) => `${p.name} | ${p.format}`)].join(', ')}`);
      continue;
    }
    mkdirSync(dirname(resolve(file)), { recursive: true });
    writeFileSync(file, 'pdf' in made ? made.pdf : made.docx);
    said.push(`${file}${made.missing.length ? `   missing: ${made.missing.join(', ')}` : ''}`);
  }
  return { out: said.join('\n'), err: '', code: failed ? 1 : 0 };
}
