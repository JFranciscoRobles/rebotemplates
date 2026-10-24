import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHead } from '@/components/docs/ui';
import { LINK, PROSE } from '@/components/docs/styles';
import { PAGES, REBODOCS, hrefOf } from '@/lib/site';

export const metadata: Metadata = {
  title: 'What is ReboTemplates',
  description: 'A document generator: a template written in Word, data as JSON, and back a .docx or a PDF. The pages of its documentation.',
  alternates: { canonical: '/docs/' },
};

export default function DocsIndex() {
  return (
    <>
      <h1 className="m-0 mt-3 font-display text-[clamp(36px,4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.03em]">What is ReboTemplates</h1>
      <p className="m-0 mt-3.5 max-w-[700px] text-lg leading-[1.6] text-muted">
        A document generator: a template written in Word, data as JSON, and back a .docx or a PDF. Variables, repeating tables, conditions and formats, rendered on your server or in the browser. Free
        for any company, open source under MIT.
      </p>
      <p className={PROSE}>
        It needs nothing else from the Rebo suite; inside, it uses the engine of{' '}
        <a href={REBODOCS} className={LINK}>
          Rebodocs
        </a>
        , measured line by line against Word. A template made here opens in the Rebodocs editor with its variables, and one made there renders here.
      </p>
      <section aria-labelledby="pages" className="mt-14">
        <SectionHead id="pages" badge="Pages" color="orange" title="Where to go" />
        <ul className="m-0 mt-6 grid max-w-[760px] list-none gap-3 p-0">
          {PAGES.filter((page) => page.slug !== 'index').map((page) => (
            <li key={page.slug}>
              <Link href={hrefOf(page.slug)} className="block rounded-2xl border border-border p-4.5 transition duration-250 hover:-translate-y-1 hover:shadow-lift">
                <span className="font-display text-[17px] font-bold">{page.title}</span>
                <span className="mt-1 block text-[15px] text-muted">{hrefOf(page.slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
