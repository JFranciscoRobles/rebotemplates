// A template read once and filled many times: reading the DOCX and finding
// its variables is the slow part, so `loadTemplate` does it once.

import { type Block, type Doc, findAllVariables, importDocx, templateBlocks } from '@rebodocs/core';
import { isPicture } from './pictures';

export interface Template {
  /** The document as Rebodocs reads it. */
  readonly doc: Doc;
  /** The names of its variables, each once, in the order they first appear, without their formats. */
  readonly names: string[];
  readonly blocks: Block[];
  /** The names of the variables that are pictures ({{logo | image}}), each once. */
  readonly pictures: string[];
}

export type TemplateSource = Template | Uint8Array | ArrayBuffer;

export function loadTemplate(source: TemplateSource): Template {
  if (!(source instanceof Uint8Array) && !(source instanceof ArrayBuffer)) return source;
  const doc = importDocx(source instanceof Uint8Array ? source : new Uint8Array(source));
  const names: string[] = [];
  const pictures: string[] = [];
  for (const variable of findAllVariables(doc)) {
    if (!names.includes(variable.name)) names.push(variable.name);
    if (isPicture(variable.formats) && !pictures.includes(variable.name)) pictures.push(variable.name);
  }
  return { doc, names, blocks: templateBlocks(doc), pictures };
}

export interface VariableInfo {
  name: string;
  /** The formats it is written with, as the template has them: `currency`, `date:d MMM yyyy`. */
  formats: string[];
  /** How many times the template uses it. */
  uses: number;
  /** The block it is inside, when it is a field of each item: `items` for `items.price`. */
  block?: string;
  /** Worked out in code, by `computed`, rather than given in the data. */
  computed: boolean;
  /** A picture ({{logo | image}}): its value is a data: address, or bytes, a path or an address `resolvePictures` loads. */
  picture: boolean;
}

export interface Inspection {
  variables: VariableInfo[];
  blocks: { name: string; inverted: boolean; kind: Block['kind'] }[];
}

/** What a template asks for: its variables, their formats, its blocks. With the names `computed` will give, so they are not asked of the data. */
export function inspect(source: TemplateSource, options: { computed?: Record<string, unknown> } = {}): Inspection {
  const template = loadTemplate(source);
  const blockNames = template.blocks.map((block) => block.name);
  const variables: VariableInfo[] = [];
  for (const use of findAllVariables(template.doc)) {
    const known = variables.find((variable) => variable.name === use.name);
    if (known) {
      known.uses++;
      for (const format of use.formats) if (!known.formats.includes(format)) known.formats.push(format);
      continue;
    }
    // The innermost block it is a field of.
    const block = blockNames.filter((name) => use.name.startsWith(`${name}.`)).sort((a, b) => b.length - a.length)[0];
    variables.push({ name: use.name, formats: [...use.formats], uses: 1, block, computed: Boolean(options.computed && use.name in options.computed), picture: isPicture(use.formats) });
  }
  return { variables, blocks: template.blocks.map(({ name, inverted, kind }) => ({ name, inverted, kind })) };
}
