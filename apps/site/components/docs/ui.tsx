import type { ReactNode } from 'react';
import { PASTEL_CLASS, type Pastel } from '@/lib/home';
import { highlight } from '@/lib/highlight';
import { CODE } from './styles';

// What the pages of the documentation share: how a section starts, the yellow
// warning, and code coloured on the server. As Rebodocs' components/docs/ui.tsx.

/** A pill, a heading and a line under it: how each section of the page starts. */
export function SectionHead({ id, badge, color, title, children }: { id: string; badge: string; color: Pastel; title: string; children?: ReactNode }) {
  return (
    <>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PASTEL_CLASS[color]}`}>{badge}</span>
      <h2 id={id} className="m-0 mt-3.5 scroll-mt-24 font-display text-[30px] font-extrabold tracking-[-0.03em]">
        {title}
      </h2>
      {children && <p className="m-0 mt-2.5 max-w-[720px] text-[17px] leading-[1.6] text-muted">{children}</p>}
    </>
  );
}

/** Something that goes wrong if it is not known. */
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p className="m-0 mt-6 flex max-w-[760px] items-start gap-3 rounded-xl bg-pastel-yellow px-5 py-4 text-[15px] leading-[1.55] text-[#5c4a1e]">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 flex-none">
        <circle cx="10" cy="10" r="8" fill="none" stroke="#8A5A00" strokeWidth="1.6" />
        <path d="M10 6v5M10 13.5v.5" stroke="#8A5A00" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span>
        <strong className="text-[#3e2f00]">{title}</strong> {children}
      </span>
    </p>
  );
}

/** A block of code, coloured when the site is built. */
export async function Code({ lang, children }: { lang: string; children: string }) {
  return <div className={`mt-4 max-w-[820px] ${CODE}`} dangerouslySetInnerHTML={{ __html: await highlight(children, lang) }} />;
}
