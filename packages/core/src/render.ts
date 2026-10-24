// Filling a template: the data made ready (data.ts), then Rebodocs' own
// fillVariables, then the document written as a DOCX.

import { type Doc, exportDocx, fillVariables, variableProblems } from '@rebodocs/core';
import { type Computed, type Missing, prepare } from './data';
import { type TemplateSource, loadTemplate } from './template';

export interface RenderOptions {
  /** Values worked out in code: `'items.amount': (item) => item.qty * item.price`, `total: (data) => …`. */
  computed?: Record<string, Computed>;
  /** The language numbers, dates and money are written in: `en-US`, `es-MX`. The template's own unless given. */
  locale?: string;
  /** The currency of `| currency`: `USD`, `EUR`, `MXN`. */
  currency?: string;
  /** What "today" is for dates relative to it. */
  today?: Date;
  /** What to do with a value the data lacks: `[path]` in the document (the default), nothing, or the {{variable}} kept. */
  missing?: Missing;
}

export interface Problem {
  name: string;
  /** The format that went wrong: `currency`, `date`. */
  format: string;
  /** A format that does not exist, or a value it cannot write (text where a number goes). */
  kind: 'format' | 'value';
}

export interface Filled {
  doc: Doc;
  /** The values the data lacked, as a person names them: `client.city`, `items[2].price`. */
  missing: string[];
  problems: Problem[];
}

/** The template filled, as a document still: for `render`, `toPdf`, or anything else Rebodocs does with one. */
export function fill(source: TemplateSource, data: Record<string, unknown>, options: RenderOptions = {}): Filled {
  const template = loadTemplate(source);
  const prepared = prepare(
    data,
    template.names,
    template.blocks.map((block) => block.name),
    options.computed,
    options.missing,
  );
  const formats = { locale: options.locale, currency: options.currency, today: options.today };
  return {
    doc: fillVariables(template.doc, prepared.data, formats),
    missing: prepared.missing,
    problems: variableProblems(template.doc, prepared.data, formats),
  };
}

export interface Rendered {
  /** The document, as a .docx. */
  docx: Uint8Array;
  missing: string[];
  problems: Problem[];
}

/** The template filled with the data, as a .docx. */
export function render(source: TemplateSource, data: Record<string, unknown>, options: RenderOptions = {}): Rendered {
  const { doc, missing, problems } = fill(source, data, options);
  return { docx: exportDocx(doc), missing, problems };
}

export interface Check {
  /** Whether it would render with nothing missing and nothing wrong. */
  ok: boolean;
  missing: string[];
  problems: Problem[];
}

/** What would go wrong rendering, before anything is made: values missing, formats that do not exist, values a format cannot write. */
export function check(source: TemplateSource, data: Record<string, unknown>, options: Omit<RenderOptions, 'missing'> = {}): Check {
  const template = loadTemplate(source);
  const prepared = prepare(
    data,
    template.names,
    template.blocks.map((block) => block.name),
    options.computed,
    'keep',
  );
  const problems = variableProblems(template.doc, prepared.data, { locale: options.locale, currency: options.currency, today: options.today });
  return { ok: prepared.missing.length === 0 && problems.length === 0, missing: prepared.missing, problems };
}
