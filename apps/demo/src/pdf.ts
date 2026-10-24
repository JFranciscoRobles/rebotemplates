// The PDF made in the page: Rebodocs' layout and PDF, as on a server, with
// Carlito standing in for Calibri (they have the same measures). The fonts
// are fetched the first time a PDF is asked for.

import { type Doc, type FontFile, readFont, renderPdf } from '@rebodocs/core';

let fonts: Promise<FontFile[]> | undefined;

const load = (file: string, bold: boolean) =>
  fetch(`/fonts/${file}`)
    .then((answer) => answer.arrayBuffer())
    .then((bytes) => readFont(new Uint8Array(bytes), { family: 'Calibri', bold, italic: false }));

export async function pdfOf(doc: Doc, title: string): Promise<Uint8Array> {
  fonts ??= Promise.all([load('Carlito-Regular.ttf', false), load('Carlito-Bold.ttf', true)]).then((read) => read.filter((font): font is FontFile => !!font));
  return renderPdf(doc, await fonts, title, 'en-US').pdf;
}
