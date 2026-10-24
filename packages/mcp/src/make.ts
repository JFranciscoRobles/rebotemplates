// A finished document turned into a template: texts that become variables, a
// row of a table or paragraphs that become the ones repeated for each item of
// a list, and paragraphs or text kept only when the data says so. What an assistant proposes after
// reading the document; each change found by its exact text, with Rebodocs'
// public API, so that what was not found is said rather than guessed.

import { type Doc, type Range, deleteRange, deleteRow, docText, findAll, insertText, paragraphText, replaceAll, replaceRange, splitParagraph } from '@rebodocs/core';

export interface VariableMark {
  /** The text as it reads in the document: "Northwind S.A.". */
  find: string;
  /** The variable it becomes: "client.name". */
  variable: string;
  /** A format: "currency", "long date", "upper". */
  format?: string;
  /** Only the first place it appears, rather than every one. */
  first?: boolean;
  /**
   * A longer text it is inside, to tell it from the same text elsewhere: "3" in "for 3 years", not the "3" of
   * "3. Confidentiality". Each place this text is, the variable's text inside it is changed.
   */
  in?: string;
}

export interface RowMark {
  /** A text in the row to repeat, to find it by: "Design sprint". */
  find: string;
  /** The list each item of which writes a row: "items". */
  list: string;
  /** The texts of that row that become fields of each item: "Design sprint" → "name". */
  fields: { find: string; field: string; format?: string }[];
  /** A text in each other row of the same table that was an item too, and goes: "Editor licences". */
  remove?: string[];
}

export interface ListMark {
  /** A text in the (first) paragraph of the item to keep and repeat: "A brand guide". */
  find: string;
  /** A text in its last paragraph, when an item is several. */
  to?: string;
  /** The list each item of which writes those paragraphs: "deliverables". */
  list: string;
  /** The texts of those paragraphs that become fields of each item. */
  fields: { find: string; field: string; format?: string }[];
  /** A text in each paragraph of the other items, which go. */
  remove?: string[];
}

export interface ConditionMark {
  /** A text in the paragraph to keep or leave out: "PAID". */
  find: string;
  /** The value it depends on: "paid". */
  when: string;
  /** Kept when the value is not there, rather than when it is. */
  unless?: boolean;
  /** A text in the last paragraph, when what depends on the value is several: a clause with its heading. */
  to?: string;
  /** Only the text found, inside its paragraph, rather than the whole paragraph: " each month". */
  inline?: boolean;
}

export interface Marking {
  variables?: VariableMark[];
  rows?: RowMark[];
  lists?: ListMark[];
  conditions?: ConditionMark[];
}

export interface Made {
  doc: Doc;
  /** What was done, a line each. */
  done: string[];
  /** What was asked for and not found, a line each. */
  missed: string[];
}

const tag = (name: string, format?: string) => `{{${name}${format ? ` | ${format}` : ''}}}`;
const MATCH = { matchCase: true };

/** The first place a text is, inside a table or outside every table. */
function firstAt(doc: Doc, text: string, inTable: boolean) {
  return findAll(doc, text, MATCH).find((range) => Boolean(doc.paragraphs[range.from.para].cell) === inTable);
}

function markRow(doc: Doc, row: RowMark, done: string[], missed: string[]): Doc {
  const at = firstAt(doc, row.find, true);
  if (!at) {
    missed.push(`No row of a table with "${row.find}" in it.`);
    return doc;
  }
  const cell = doc.paragraphs[at.from.para].cell!;
  const inRow = (para: number) => {
    const here = doc.paragraphs[para].cell;
    return !!here && here.table === cell.table && here.row === cell.row;
  };
  // Each field replaced where it is in that row, found again after each change, as offsets move.
  for (const field of row.fields) {
    const range = findAll(doc, field.find, MATCH).find((found) => inRow(found.from.para));
    if (!range) {
      missed.push(`No "${field.find}" in the row of "${row.find}", for ${row.list}.${field.field}.`);
      continue;
    }
    doc = replaceRange(doc, range, tag(`${row.list}.${field.field}`, field.format)).doc;
    done.push(`"${field.find}" → ${tag(`${row.list}.${field.field}`, field.format)}`);
  }
  // The marks of the block in the first cell and the last: that is how Rebodocs knows a row repeats.
  const cells = doc.tables![cell.table].rows.find((r) => r.id === cell.row)!.cells;
  const paras = doc.paragraphs.flatMap((p, i) => (p.cell && inRow(i) ? [i] : []));
  const first = paras.find((i) => doc.paragraphs[i].cell!.cell === cells[0].id)!;
  const last = paras.filter((i) => doc.paragraphs[i].cell!.cell === cells[cells.length - 1].id).pop()!;
  doc = insertText(doc, { para: last, offset: paragraphText(doc.paragraphs[last]).length }, `{{/${row.list}}}`).doc;
  doc = insertText(doc, { para: first, offset: 0 }, `{{#${row.list}}}`).doc;
  done.push(`The row of "${row.find}" repeats for each item of ${row.list}.`);

  for (const text of row.remove ?? []) {
    const other = findAll(doc, text, MATCH).find((found) => {
      const here = doc.paragraphs[found.from.para].cell;
      return !!here && here.table === cell.table && here.row !== cell.row;
    });
    if (!other) {
      missed.push(`No other row with "${text}" in the table of "${row.find}".`);
      continue;
    }
    doc = deleteRow(doc, other.from.para).doc;
    done.push(`The row of "${text}" taken out: the list writes it now.`);
  }
  return doc;
}

const end = (doc: Doc, para: number) => paragraphText(doc.paragraphs[para]).length;

/**
 * The paragraphs from `first` to `last` between two of their own, `open` and `close`: how Rebodocs knows a
 * block is paragraphs, which it repeats or leaves out whole.
 */
function wrapParagraphs(doc: Doc, first: number, last: number, open: string, close: string): Doc {
  doc = splitParagraph(doc, { para: last, offset: end(doc, last) }).doc;
  doc = insertText(doc, { para: last + 1, offset: 0 }, close).doc;
  doc = insertText(doc, { para: first, offset: 0 }, open).doc;
  return splitParagraph(doc, { para: first, offset: open.length }).doc;
}

/** A paragraph taken out whole, its text and its end; the last one of the document, with the end of the one before. */
function removeParagraph(doc: Doc, para: number): Doc {
  if (para + 1 < doc.paragraphs.length) return deleteRange(doc, { from: { para, offset: 0 }, to: { para: para + 1, offset: 0 } });
  return deleteRange(doc, { from: { para: para - 1, offset: end(doc, para - 1) }, to: { para, offset: end(doc, para) } });
}

/** The paragraph a text is first in, outside every table, at `from` or after. */
const paragraphOf = (doc: Doc, text: string, from = 0) => findAll(doc, text, MATCH).find((range) => range.from.para >= from && !doc.paragraphs[range.from.para].cell)?.from.para;

function markList(doc: Doc, list: ListMark, done: string[], missed: string[]): Doc {
  let first = paragraphOf(doc, list.find);
  if (first === undefined) {
    missed.push(`No paragraph with "${list.find}" in it, for ${list.list}.`);
    return doc;
  }
  let last = list.to === undefined ? first : paragraphOf(doc, list.to, first);
  if (last === undefined) {
    missed.push(`No paragraph with "${list.to}" at or after "${list.find}", for ${list.list}.`);
    return doc;
  }
  for (const field of list.fields) {
    const range = findAll(doc, field.find, MATCH).find((found) => found.from.para >= first! && found.from.para <= last!);
    if (!range) {
      missed.push(`No "${field.find}" in the item of "${list.find}", for ${list.list}.${field.field}.`);
      continue;
    }
    doc = replaceRange(doc, range, tag(`${list.list}.${field.field}`, field.format)).doc;
    done.push(`"${field.find}" → ${tag(`${list.list}.${field.field}`, field.format)}`);
  }
  for (const text of list.remove ?? []) {
    const para = findAll(doc, text, MATCH).find((found) => (found.from.para < first! || found.from.para > last!) && !doc.paragraphs[found.from.para].cell)?.from.para;
    if (para === undefined) {
      missed.push(`No other paragraph with "${text}", for ${list.list}.`);
      continue;
    }
    doc = removeParagraph(doc, para);
    if (para < first) first--, last--;
    done.push(`The paragraph of "${text}" taken out: the list writes it now.`);
  }
  doc = wrapParagraphs(doc, first, last, `{{#${list.list}}}`, `{{/${list.list}}}`);
  done.push(`The paragraph${first === last ? '' : 's'} of "${list.find}" repeat${first === last ? 's' : ''} for each item of ${list.list}.`);
  return doc;
}

function markCondition(doc: Doc, condition: ConditionMark, done: string[], missed: string[]): Doc {
  const range = findAll(doc, condition.find, MATCH)[0];
  if (!range) {
    missed.push(`No paragraph with "${condition.find}" in it, for ${condition.when}.`);
    return doc;
  }
  const sign = condition.unless ? '^' : '#';
  const open = `{{${sign}${condition.when}}}`;
  const close = `{{/${condition.when}}}`;
  const kept = condition.unless ? 'not there' : 'there';
  if (condition.inline) {
    // The end first, so the start stays where it was found.
    doc = insertText(doc, range.to, close).doc;
    doc = insertText(doc, range.from, open).doc;
    done.push(`"${condition.find}" is written only when ${condition.when} is ${kept}.`);
    return doc;
  }
  const para = range.from.para;
  if (condition.to !== undefined) {
    const last = findAll(doc, condition.to, MATCH).find((found) => found.from.para >= para)?.from.para;
    if (last === undefined) {
      missed.push(`No paragraph with "${condition.to}" at or after "${condition.find}", for ${condition.when}.`);
      return doc;
    }
    doc = wrapParagraphs(doc, para, last, open, close);
    done.push(`The paragraphs from "${condition.find}" to "${condition.to}" are kept only when ${condition.when} is ${kept}.`);
    return doc;
  }
  doc = insertText(doc, { para, offset: end(doc, para) }, close).doc;
  doc = insertText(doc, { para, offset: 0 }, open).doc;
  done.push(`The paragraph of "${condition.find}" is kept only when ${condition.when} is ${kept}.`);
  return doc;
}

/** Where `text` is inside each place `around` is, in the same paragraph. */
function inside(doc: Doc, text: string, around: string): Range[] {
  return findAll(doc, around, MATCH).flatMap((range) => {
    if (range.from.para !== range.to.para) return [];
    const at = paragraphText(doc.paragraphs[range.from.para]).slice(range.from.offset, range.to.offset).indexOf(text);
    return at < 0 ? [] : [{ from: { para: range.from.para, offset: range.from.offset + at }, to: { para: range.from.para, offset: range.from.offset + at + text.length } }];
  });
}

function markVariable(doc: Doc, mark: VariableMark, done: string[], missed: string[]): Doc {
  const text = tag(mark.variable, mark.format);
  if (mark.in !== undefined) {
    const ranges = inside(doc, mark.find, mark.in);
    if (!ranges.length) {
      missed.push(`No "${mark.find}" in "${mark.in}", for ${mark.variable}.`);
      return doc;
    }
    // From the last back, so the places before stay where they were found.
    for (const range of (mark.first ? ranges.slice(0, 1) : ranges).reverse()) doc = replaceRange(doc, range, text).doc;
    done.push(`"${mark.find}" in "${mark.in}" → ${text}${!mark.first && ranges.length > 1 ? `, ${ranges.length} times` : ''}`);
    return doc;
  }
  if (mark.first) {
    const range = findAll(doc, mark.find, MATCH)[0];
    if (!range) {
      missed.push(`No "${mark.find}" in the document, for ${mark.variable}.`);
      return doc;
    }
    done.push(`"${mark.find}" → ${text}, the first time`);
    return replaceRange(doc, range, text).doc;
  }
  const { doc: next, count } = replaceAll(doc, mark.find, text, MATCH);
  if (!count) missed.push(`No "${mark.find}" in the document, for ${mark.variable}.`);
  else done.push(`"${mark.find}" → ${text}${count > 1 ? `, ${count} times` : ''}`);
  return next;
}

/**
 * The document with the marks asked for. Rows and lists go first, as their
 * texts are found in their own item; then conditions, which wrap paragraphs
 * or text; then the variables, everywhere their text is.
 */
export function markTemplate(doc: Doc, marking: Marking): Made {
  const done: string[] = [];
  const missed: string[] = [];
  for (const row of marking.rows ?? []) doc = markRow(doc, row, done, missed);
  for (const list of marking.lists ?? []) doc = markList(doc, list, done, missed);
  for (const condition of marking.conditions ?? []) doc = markCondition(doc, condition, done, missed);
  for (const variable of marking.variables ?? []) doc = markVariable(doc, variable, done, missed);
  return { doc, done, missed };
}

/** The text of a template, a paragraph a line, as the assistant shows it to the person. */
export const templateText = (doc: Doc): string => docText(doc);
