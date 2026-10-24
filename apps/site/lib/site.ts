/** Where the code is. One place to change it. */
export const REPO = 'https://github.com/JFranciscoRobles/rebotemplates';
export const SITE = 'https://rebotemplates.com';
/** Every package, on npm. */
export const NPM_ORG = 'https://www.npmjs.com/org/rebotemplates';
/** The engine inside, and the editor the same templates open in. */
export const REBODOCS = 'https://www.rebodocs.com';

import type { Pastel } from './home';

export interface NavItem {
  title: string;
  /** The folder of the page under `app/(site)/docs`; `index` is `/docs/`. */
  slug: string;
}

/** The pages of the documentation, in the order they are read; each group has its colour in the sidebar. As Rebodocs' NAV. */
export const NAV: { title: string; color: Pastel; items: NavItem[] }[] = [
  {
    title: 'Start',
    color: 'orange',
    items: [
      { title: 'What is ReboTemplates', slug: 'index' },
      { title: 'Getting started', slug: 'getting-started' },
    ],
  },
  {
    title: 'Reference',
    color: 'green',
    items: [{ title: 'Status and roadmap', slug: 'status' }],
  },
];

export const PAGES = NAV.flatMap((group) => group.items);
export const hrefOf = (slug: string) => (slug === 'index' ? '/docs/' : `/docs/${slug}/`);

export const DOCS = hrefOf('getting-started');
export const STATUS = hrefOf('status');
