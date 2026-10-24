// A finished document turned into a template: texts that become variables, a
// row of a table that becomes the one repeated for each item of a list, and
// paragraphs kept only when the data says so. What an assistant proposes after
// reading the document; each change found by its exact text, with Rebodocs'
// public API, so that what was not found is said rather than guessed.

import { type Doc, deleteRow, docText, findAll, insertText, paragraphText, replaceAll, replaceRange } from '@rebodocs/core';

export interface VariableMark {
  /** The text as it reads in the document: "Northwind S.A.". */
  find: string;
  /** The variable it becomes: "client.name". */
  variable: string;
  /** A format: "currency", "long date", "upper". */
  format?: string;
  /** Only the first place it appears, rather than every one. */
  first?: boolean;
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

export interface ConditionMark {
  /** A text in the paragraph to keep or leave out: "PAID". */
  find: string;
  /** The value it depends on: "paid". */
  when: string;
  /** Kept when the value is not there, rather than when it is. */
  unless?: boolean;
}

export interface Marking {
  variables?: VariableMark[];
  rows?: RowMark[];
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

function markCondition(doc: Doc, condition: ConditionMark, done: string[], missed: string[]): Doc {
  const range = findAll(doc, condition.find, MATCH)[0];
  if (!range) {
    missed.push(`No paragraph with "${condition.find}" in it, for ${condition.when}.`);
    return doc;
  }
  const para = range.from.para;
  const sign = condition.unless ? '^' : '#';
  doc = insertText(doc, { para, offset: paragraphText(doc.paragraphs[para]).length }, `{{/${condition.when}}}`).doc;
  doc = insertText(doc, { para, offset: 0 }, `{{${sign}${condition.when}}}`).doc;
  done.push(`The paragraph of "${condition.find}" is kept only when ${condition.when} is ${condition.unless ? 'not there' : 'there'}.`);
  return doc;
}

function markVariable(doc: Doc, mark: VariableMark, done: string[], missed: string[]): Doc {
  const text = tag(mark.variable, mark.format);
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
 * The document with the marks asked for. Rows go first, as their texts are
 * found in their own row; then conditions, which wrap whole paragraphs; then
 * the variables, everywhere their text is.
 */
export function markTemplate(doc: Doc, marking: Marking): Made {
  const done: string[] = [];
  const missed: string[] = [];
  for (const row of marking.rows ?? []) doc = markRow(doc, row, done, missed);
  for (const condition of marking.conditions ?? []) doc = markCondition(doc, condition, done, missed);
  for (const variable of marking.variables ?? []) doc = markVariable(doc, variable, done, missed);
  return { doc, done, missed };
}

/** The text of a template, a paragraph a line, as the assistant shows it to the person. */
export const templateText = (doc: Doc): string => docText(doc);
