// What the landing page says: one place for the version, the packages and the
// features, so the badge, the install picker and the table change together.

import { version } from '../package.json';

/** The version the packages will be published at; the site moves with them. */
export const VERSION = version;
/**
 * Whether the packages are on npm. Until they are, the page shows no command
 * to install them (ROADMAP.md): turn it on with the first publish.
 */
export const PUBLISHED = false;

/** The six pastel pairs, background and text, that take turns on tags, icons and packages. */
export type Pastel = 'blue' | 'yellow' | 'green' | 'pink' | 'purple' | 'orange';
export const PASTELS: Pastel[] = ['blue', 'yellow', 'green', 'pink', 'purple', 'orange'];
/** Whole class names, so Tailwind finds them. */
export const PASTEL_CLASS: Record<Pastel, string> = {
  blue: 'bg-pastel-blue text-pastel-blue-fg',
  yellow: 'bg-pastel-yellow text-pastel-yellow-fg',
  green: 'bg-pastel-green text-pastel-green-fg',
  pink: 'bg-pastel-pink text-pastel-pink-fg',
  purple: 'bg-pastel-purple text-pastel-purple-fg',
  orange: 'bg-pastel-orange text-pastel-orange-fg',
};
export const pastelAt = (i: number) => PASTELS[i % PASTELS.length];

/** What it does today; what is coming is said on its feature, not here. */
export const TAGS = [
  'Designed in Word',
  'Variables',
  'Loops & tables',
  'Conditions',
  'Images',
  'Formatters',
  'Computed values',
  'DOCX out',
  'PDF out',
  'Checked before you send',
  'CLI',
  'Claude via MCP',
  'Free for any company',
];

export interface Package {
  name: string;
  what: string;
  tag: string;
  color: Pastel;
  /** What the install picker says to run; `npm install` and the name unless said. */
  command?: string;
  /** Not written yet: the version it comes in. */
  comes?: string;
}

/** In the order of the table. */
export const PACKAGES: Package[] = [
  { name: '@rebotemplates/core', what: 'Template filling: variables, loops, conditions, formats, values computed in code, and inspection.', tag: 'No DOM', color: 'blue' },
  { name: '@rebotemplates/pdf', what: 'PDF output with embedded fonts and selectable text, without a browser.', tag: 'Node', color: 'pink' },
  {
    name: '@rebotemplates/cli',
    what: 'Render, inspect and check from the command line, one document or one per line of a JSON lines file.',
    tag: 'CLI',
    color: 'green',
    command: 'npx @rebotemplates/cli --help',
  },
  {
    name: '@rebotemplates/mcp',
    what: 'Tools for an AI assistant to make templates and generate documents: an MCP server for Claude Desktop and other clients.',
    tag: 'MCP',
    color: 'orange',
    command: 'npx @rebotemplates/mcp --dir ./templates',
  },
];
/** In the order of the install picker: the one an application installs first. */
export const INSTALL_ORDER = ['@rebotemplates/core', '@rebotemplates/pdf', '@rebotemplates/cli', '@rebotemplates/mcp'];
export const commandOf = (name: string) => PACKAGES.find((pkg) => pkg.name === name)?.command ?? `npm install ${name}`;

export const npmOf = (name: string) => `https://www.npmjs.com/package/${name}`;

/** Title, description, the path of a 24 × 24 icon drawn with a stroke, and the version it comes in when it is not here yet. */
export const FEATURES: [string, string, string, string?][] = [
  [
    'Designed in Word',
    'Templates are ordinary .docx files. Anyone on the team can change the wording, the logo or the layout.',
    'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
  ],
  [
    'Variables',
    'Double braces for any value, with dotted paths into nested objects. The same syntax the Rebodocs editor reads.',
    'M8 3c-2 0-2 2-2 4s0 4-2 4c2 0 2 2 2 4s0 4 2 4M16 3c2 0 2 2 2 4s0 4 2 4c-2 0-2 2-2 4s0 4-2 4',
  ],
  ['Loops and tables', 'Repeat a table row, a paragraph or a whole section once for every item in a list.', 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3'],
  ['Conditions', 'Show a clause, a stamp or a page only when the data says so.', 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9'],
  ['Images', 'Logos, signatures, charts and QR codes, from bytes, a path or a URL, at the width the template says.', 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21'],
  ['Formatters', 'Money, dates and numbers in your locale; totals and other values worked out in plain JavaScript.', 'M4 7V4h16v3M9 20h6M12 4v16'],
  ['Word in, Word out', 'Styles, headers, footers and numbering survive; the result opens in Word as designed.', 'M12 3v12M7 10l5 5 5-5M5 21h14'],
  [
    'PDF without a browser',
    'PDFs with embedded fonts and selectable text, tagged for screen readers, made without LibreOffice or a headless browser.',
    'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
  ],
  ['Fast and small', 'A .docx in under a millisecond and a PDF in a few; 49 KB gzipped, engine included, for a serverless function. Measured.', 'M13 2 3 14h9l-1 8 10-12h-9z'],
  ['Checked before you send', 'List every variable a template expects, and get a clear error for each one the data is missing.', 'M20 6 9 17l-5-5'],
  ['Command line', 'Generate a folder of documents from a JSON lines file, for one-off jobs and scripts.', 'M4 17l6-6-6-6M12 19h8'],
  ['AI assistants', 'Claude turns a finished .docx into a template and generates documents from data, through MCP.', 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'],
];
