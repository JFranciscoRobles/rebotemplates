import Link from 'next/link';
import { VERSION } from '@/lib/home';
import { DOCS, NPM_ORG, REBODOCS, REPO, STATUS } from '@/lib/site';

const ghost = 'rounded-lg px-3 py-2 text-ink transition-colors hover:bg-hover';
export const primary = 'bg-brand font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(194,84,10,0.22)]';

/** Rebodocs' tile in orange, with braces on the page. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#FCEBDD" />
      <path d="M10 9h9l4 4v10a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z" fill="#FFFFFF" stroke="#C2540A" strokeWidth="1.8" strokeLinejoin="round" />
      <path
        d="M14.3 14.5c-1 0-1 .8-1 1.6s-.6 1.1-1.1 1.1c.5 0 1.1.3 1.1 1.1s0 1.6 1 1.6M17.7 14.5c1 0 1 .8 1 1.6s.6 1.1 1.1 1.1c-.5 0-1.1.3-1.1 1.1s0 1.6-1 1.6"
        fill="none"
        stroke="#C2540A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The header of the landing page. Its links go down to a second line on a narrow screen. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4.5">
      <Link href="/" className="flex items-center gap-2.5 text-ink">
        <Logo />
        <span className="font-display text-xl font-extrabold tracking-[-0.03em]">ReboTemplates</span>
      </Link>
      <span className="rounded-full bg-pastel-green px-2.5 py-1 text-xs font-medium text-pastel-green-fg">Free · Open source · MIT · v{VERSION}</span>
      <nav aria-label="Main" className="ml-auto flex flex-wrap items-center gap-0.5 text-[15px] font-medium">
        <a href="/#demo" className={ghost}>
          Demo
        </a>
        <a href={DOCS} className={ghost}>
          Docs
        </a>
        <a href={STATUS} className={ghost}>
          Status
        </a>
        <a href={NPM_ORG} className={ghost}>
          npm
        </a>
        <a href={REPO} className={ghost}>
          GitHub
        </a>
        <a href={DOCS} className={`ml-2 rounded-[10px] px-4 py-2.5 ${primary}`}>
          Get started
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-6 pb-10 pt-8 text-sm text-muted">
        <span className="font-display text-base font-extrabold tracking-[-0.03em] text-ink">ReboTemplates</span>
        <a href={DOCS} className="hover:text-ink">
          Docs
        </a>
        <a href={STATUS} className="hover:text-ink">
          Status &amp; roadmap
        </a>
        <a href={NPM_ORG} className="hover:text-ink">
          npm
        </a>
        <a href={REPO} className="hover:text-ink">
          GitHub
        </a>
        <span className="flex flex-col gap-1 sm:ml-auto sm:items-end">
          <span>
            Part of the Rebo suite:{' '}
            <a href={REBODOCS} className="font-medium text-docs hover:text-docs-hover">
              Rebodocs
            </a>{' '}
            · <span className="font-medium text-files">ReboFiles</span> · <span className="font-medium text-brand">ReboTemplates</span>
          </span>
          <span>Open source under the MIT license.</span>
        </span>
      </div>
    </footer>
  );
}
