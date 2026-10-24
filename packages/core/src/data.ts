// The data a template is filled with, made ready before Rebodocs fills it:
// the values computed in code added, dates written as text, and every value
// the template asks for and the data lacks marked, so that it shows in the
// document instead of a {{variable}} left behind.
//
// A name of a template is a path: `client.name`, or `items.price` for the
// price of each item of `items`. Where a step of the path is a list, the rest
// of the path is followed in each item.

import type { TemplateData, TemplateValue } from '@rebodocs/core';

/** A value worked out from the data. For a path inside a list, `item` is the item it is for; at the top, the whole data. */
export type Computed = (item: Record<string, unknown>, data: Record<string, unknown>) => unknown;

/** What a template does with a value the data lacks: shows `[path]` (the default), leaves it empty, or keeps the {{variable}} to be filled later. */
export type Missing = 'mark' | 'empty' | 'keep';

type Holder = Record<string, unknown>;

const isHolder = (value: unknown): value is Holder => typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
export const isAbsent = (value: unknown) => value === undefined || value === null || value === '';

/**
 * Every object that holds the last step of `path`, with how a person names it
 * there: `items[1].price` is held by the second item. With `make`, objects
 * missing on the way are made, so a value can be put in them.
 */
export function holders(data: Holder, path: string[], make = false): { holder: Holder; where: string }[] {
  let found: { holder: Holder; where: string }[] = [{ holder: data, where: '' }];
  for (const step of path.slice(0, -1)) {
    const next: { holder: Holder; where: string }[] = [];
    for (const { holder, where } of found) {
      const name = where ? `${where}.${step}` : step;
      let value = holder[step];
      if (value === undefined && make) value = holder[step] = {};
      if (Array.isArray(value)) value.forEach((item, i) => isHolder(item) && next.push({ holder: item, where: `${name}[${i}]` }));
      else if (isHolder(value)) next.push({ holder: value, where: name });
    }
    found = next;
  }
  return found;
}

/** A copy of the data the template can take: dates as ISO text, everything else as given. */
function copyOf(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(copyOf);
  if (value instanceof Uint8Array) return value;
  if (isHolder(value)) return Object.fromEntries(Object.entries(value).map(([key, inside]) => [key, copyOf(inside)]));
  return value;
}

export interface Prepared {
  data: TemplateData;
  /** Each value the template asks for and the data lacks, as a person names it: `client.city`, `items[2].price`. */
  missing: string[];
}

/**
 * The data made ready for `names` (the template's variables) and `blocks` (the
 * names of its blocks). Computed values are worked out first, in the order
 * given, so one may use another.
 */
export function prepare(given: Record<string, unknown>, names: string[], blocks: string[], computed: Record<string, Computed> = {}, missing: Missing = 'mark'): Prepared {
  const data = copyOf(given) as Holder;
  for (const [name, compute] of Object.entries(computed)) {
    const path = name.split('.');
    const last = path[path.length - 1];
    for (const { holder } of holders(data, path, path.length === 1)) holder[last] = copyOf(compute(holder, data));
  }

  const lacking: string[] = [];
  // A block without a value would leave its marks in the document: it is taken as not there. Only one the
  // data does not name at all is said to be missing; null, false or '' are a way to say "none", as for a
  // postscript a letter may not have.
  for (const name of blocks) {
    const path = name.split('.');
    const last = path[path.length - 1];
    for (const { holder, where } of holders(data, path)) {
      if (!isAbsent(holder[last])) continue;
      if (holder[last] === undefined) lacking.push(where ? `${where}.${last}` : last);
      if (missing !== 'keep') holder[last] = false;
    }
  }
  for (const name of names) {
    const path = name.split('.');
    const last = path[path.length - 1];
    // A name inside a block of its own items ({{tags}} in {{#tags}}) is the item itself, not a field.
    if (blocks.includes(name)) continue;
    for (const { holder, where } of holders(data, path, missing !== 'keep' && !blocks.some((block) => name.startsWith(`${block}.`)))) {
      if (!isAbsent(holder[last])) continue;
      lacking.push(where ? `${where}.${last}` : last);
      if (missing === 'mark') holder[last] = `[${name}]`;
      else if (missing === 'empty') holder[last] = '';
    }
  }
  return { data: data as TemplateData, missing: [...new Set(lacking)] };
}

export type { TemplateData, TemplateValue };
