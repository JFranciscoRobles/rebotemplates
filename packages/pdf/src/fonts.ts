// Font files for laying a document out with no browser: the ones given, and
// the ones of the system whose names look like the families the document
// asks for. As Rebodocs' own generator finds them (packages/mcp/src/fonts.ts
// there), but with its public API only.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { type Doc, type FontFile, readFonts } from '@rebodocs/core';

export const SYSTEM_FONTS = [
  '/System/Library/Fonts',
  '/Library/Fonts',
  join(homedir(), 'Library/Fonts'),
  '/usr/share/fonts',
  '/usr/local/share/fonts',
  join(homedir(), '.fonts'),
  'C:\\Windows\\Fonts',
];

/** Families read even when the document does not name them: Word's defaults, and those that stand in for a family the machine lacks. */
export const STAND_INS = ['Calibri', 'Aptos', 'Cambria', 'Arial', 'Times New Roman', 'Courier New', 'Liberation Sans', 'Liberation Serif', 'Liberation Mono', 'DejaVu Sans', 'DejaVu Serif'];

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Every .ttf, .otf and .ttc under the folders, listed once per process: a system has hundreds. */
const listed = new Map<string, string[]>();
function fontFiles(dir: string): string[] {
  const known = listed.get(dir);
  if (known) return known;
  const out: string[] = [];
  const walk = (at: string) => {
    for (const name of readdirSync(at)) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ttf|otf|ttc)$/i.test(name)) out.push(path);
    }
  };
  if (existsSync(dir)) walk(dir);
  listed.set(dir, out);
  return out;
}

/** Each file read once per process. */
const read = new Map<string, FontFile[]>();
const readFile = (path: string) => read.get(path) ?? read.set(path, readFonts(new Uint8Array(readFileSync(path)))).get(path)!;

/** The fonts of the folders whose file names start like one of the families: reading them all would take long. */
export function fontsIn(dirs: string[], families: Iterable<string>): FontFile[] {
  const wanted = [...new Set([...families].map(squash).filter(Boolean))];
  const fonts: FontFile[] = [];
  for (const dir of dirs) {
    for (const path of fontFiles(dir)) {
      const name = squash(basename(path, extname(path)));
      if (wanted.some((family) => name.startsWith(family))) fonts.push(...readFile(path));
    }
  }
  return fonts;
}

/** The families the runs of a document name themselves. Those it takes from its styles are not here: the PDF says them when they are missing, and they are looked for then. */
export function familiesOf(doc: Doc): Set<string> {
  const families = new Set<string>();
  for (const part of [doc, doc.header, doc.footer]) for (const p of part?.paragraphs ?? []) for (const run of p.runs) if (run.props.fontFamily) families.add(run.props.fontFamily);
  return families;
}
