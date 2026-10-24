// A template filled and laid out as a PDF, with no browser: the same filling
// as @rebotemplates/core, then Rebodocs' layout, the one measured against
// Word, and its PDF, tagged for screen readers.

import { readFonts, renderPdf } from '@rebodocs/core';
import { type Problem, type RenderOptions, type TemplateSource, fill } from '@rebotemplates/core';
import { STAND_INS, SYSTEM_FONTS, familiesOf, fontsIn } from './fonts';

export interface PdfOptions extends RenderOptions {
  /** Font files (their bytes) or folders of them, looked in before the system's. */
  fonts?: (Uint8Array | string)[];
  /** Whether to look in the folders of fonts of the system too. Yes unless said. */
  systemFonts?: boolean;
  /** The title the PDF says it has, for screen readers and the window of a viewer. */
  title?: string;
}

export interface PdfRendered {
  pdf: Uint8Array;
  missing: string[];
  problems: Problem[];
  /** Families the document asks for and no font given or found has: another was used in their place. */
  missingFonts: string[];
}

export function toPdf(source: TemplateSource, data: Record<string, unknown>, options: PdfOptions = {}): PdfRendered {
  const { doc, missing, problems } = fill(source, data, options);
  const given = (options.fonts ?? []).flatMap((font) => (typeof font === 'string' ? [] : readFonts(font)));
  const dirs = [...(options.fonts ?? []).filter((font): font is string => typeof font === 'string'), ...(options.systemFonts === false ? [] : SYSTEM_FONTS)];
  const families = new Set([...familiesOf(doc), ...STAND_INS]);
  let fonts = [...given, ...fontsIn(dirs, families)];
  let out = renderPdf(doc, fonts, options.title, options.locale);
  // A family the styles ask for, not named in the runs: looked for once it is known, and the document laid out again.
  const asked = [...out.missingFonts.keys()].filter((family) => !families.has(family));
  if (asked.length) {
    const more = fontsIn(dirs, asked);
    if (more.length) {
      fonts = [...fonts, ...more];
      out = renderPdf(doc, fonts, options.title, options.locale);
    }
  }
  return { pdf: out.pdf, missing, problems, missingFonts: [...out.missingFonts.keys()] };
}

export { SYSTEM_FONTS } from './fonts';
