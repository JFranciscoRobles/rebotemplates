// A badge for each person of a team: the company's logo in the header, and a
// row of a table for each person, with their photo. The pictures are real
// PNGs, small, made here; none is of a real person.

import { type Doc, type Paragraph, type RunProps, createDoc, exportDocx, insertTable, insertText } from '@rebodocs/core';

const TEXT: RunProps = { fontFamily: 'Calibri', fontSize: 11 };
const p = (text: string): Paragraph => ({ props: {}, runs: [{ text, props: TEXT }] });

export function badgeDoc(): Doc {
  let doc: Doc = { ...createDoc([p('Team of {{team}}'), p('')]), header: { paragraphs: [p('{{logo | image: 3cm}}')] } };
  doc = insertTable(doc, { para: 1, offset: 0 }, 1, 2).doc;
  const cells = doc.paragraphs.flatMap((q, i) => (q.cell ? [i] : []));
  doc = insertText(doc, { para: cells[0], offset: 0 }, '{{#people}}{{people.photo | image: 2cm}}', TEXT).doc;
  doc = insertText(doc, { para: cells[1], offset: 0 }, '{{people.name}}, {{people.role}}{{/people}}', TEXT).doc;
  return doc;
}

export const badge = (): Uint8Array => exportDocx(badgeDoc());

/** A PNG of one pixel, of the colour given (the suite's green and orange), whole: its data compressed as zlib, its checksums right. */
export const PIXELS: Record<string, string> = {
  green: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgqwkCAAF4AN2OWqPoAAAAAElFTkSuQmCC',
  orange: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGM4FMIFAAL8ASGk1ezPAAAAAElFTkSuQmCC',
};
export const pixel = (colour: keyof typeof PIXELS) => Uint8Array.from(atob(PIXELS[colour]), (c) => c.charCodeAt(0));
