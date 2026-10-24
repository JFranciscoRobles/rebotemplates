import type { ReactNode } from 'react';
import { PASTEL_CLASS, type Pastel } from '@/lib/home';
import { REBODOCS } from '@/lib/site';
import { LINK, MONO, PROSE } from '../styles';
import { SectionHead } from '../ui';
import { BENCH, MEASURED, SIZE, TESTS } from './data';

const link = (href: string, text: string) => (
  <a href={href} className={LINK}>
    {text}
  </a>
);
const code = (text: string) => <code className={MONO}>{text}</code>;

/** Checked by hand. */
const BY_HAND: ReactNode[] = [
  'The invoice rendered from the command line to a PDF, and the PDF looked at: the heading, PAID, the table with a row per item, the total.',
  'The demo driven in Chrome: the document filled again as the JSON changes, a value missing marked, a JSON broken keeping the last document, a PDF made in the page with Carlito and looked at, a .docx made.',
  'This site built as plain files and seen at the width of a desktop and of a phone, the demo working in its frame.',
  'The MCP server installed from its tarball and spoken to over standard input and output, as Claude Desktop does: the tools listed, a PDF rendered, nothing but the protocol on standard output.',
];

const NOT: [string, ReactNode][] = [
  ['Templates saved by Word itself.', 'The XML Word writes was made by hand from what Word is known to write; no file saved by Word, on Windows or a Mac, is among the tests yet.'],
  ['A cold start in a Worker.', 'The size is measured; the time a Cloudflare Worker, a Vercel function or a Lambda takes to start with it is not.'],
  ['A machine without fonts.', 'The PDF of @rebotemplates/pdf was made with the fonts of a Mac; the demo’s, with the Carlito it carries.'],
  ['Many documents at once.', 'The command line renders one per line of a JSON lines file, one after another; it was not timed on thousands.'],
];

const LIMITS: { area: string; color: Pastel; items: ReactNode[] }[] = [
  {
    area: 'Templates',
    color: 'blue',
    items: [
      <>Pictures ({code('{{logo | image}}')}) are written, in Rebodocs first, and come out with its next version.</>,
      'No expressions in the document: values are worked out in code, with computed.',
    ],
  },
  {
    area: 'Data',
    color: 'green',
    items: [<>A value missing shows as {code('[path]')} in plain text, not in colour.</>, 'A Date is written by its day in UTC.'],
  },
  {
    area: 'PDF',
    color: 'purple',
    items: ['Text left to right only, and no hyphenation: Rebodocs’ layout, with its limits.', 'A document whose styles ask for a family its runs do not name is laid out twice, to find that family.'],
  },
  { area: 'Packaging', color: 'pink', items: ['Nothing is on npm yet.', <>The command line needs a build of its own ({code('dist/')}) before it is published.</>] },
];

/** What ReboTemplates needs and the public API of @rebodocs/core does not have. */
const ASKED: [string, string][] = [
  ['Pictures as a format,', '{{name | image}}: written and tested there, to be published. ReboTemplates’ side is ready.'],
  ['The font families a document uses,', 'as Rebodocs’ resolveRun knows them, so a PDF is laid out once.'],
  ['A format of colour,', 'to mark a value missing in pink, as the demo does.'],
];

const ROADMAP: [string, string][] = [
  ['Publishing 0.1 to npm,', 'with the MCP server of 0.3 in it.'],
  ['Pictures, out with the next Rebodocs:', '{{logo | image}} is written in the engine and here; it is published when Rebodocs is. 0.2.'],
  [
    'Where it runs, measured:',
    'a Worker, a Vercel function and a Lambda rendering the invoice, with their cold starts here; a container image of the server; free fonts for servers without any. 0.4.',
  ],
  ['Use it in a real application,', 'and fix what that shows. 1.0.'],
];

/**
 * "Status and roadmap": what is checked, with the tests by package, the
 * timings and the size as they were taken; what is not; the known limits;
 * what is asked of Rebodocs; the roadmap; contributing; the license.
 */
export function StatusPage() {
  const total = TESTS.reduce((sum, row) => sum + row.count, 0);
  const most = Math.max(...TESTS.map((row) => row.count));
  const table = (head: string[], rows: string[][]) => (
    <div className="mt-5 max-w-[760px] overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead className="bg-surface text-[13px] text-muted">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-2.5 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-border">
              {row.map((cell, i) => (
                <td key={`${row[0]}-${head[i]}`} className={`px-4 py-2.5 ${i ? 'font-code text-sm tabular-nums' : 'text-ink-soft'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <h1 className="m-0 mt-3 font-display text-[clamp(36px,4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.03em]">Status and roadmap</h1>
      <p className="m-0 mt-3.5 max-w-[700px] text-lg leading-[1.6] text-muted">
        ReboTemplates is a document generator: a template written in Word, data as JSON, and back a .docx or a PDF. It is tested and not yet on npm. This page says what has been checked and how, and
        what is missing, without rounding up.
      </p>

      <section aria-labelledby="what-is-checked" className="mt-16">
        <SectionHead id="what-is-checked" badge="Checked" color="green" title="What is checked">
          The numbers here were taken on {MEASURED}, by running the commands named.
        </SectionHead>

        <h3 className="m-0 mt-10 font-display text-xl font-bold">{total} automated tests</h3>
        <p className={PROSE}>{code('npm test')}, every one passing:</p>
        <ul className="m-0 mt-5 grid max-w-[920px] list-none gap-3 p-0">
          {TESTS.map((row) => (
            <li key={row.where} className="grid items-center gap-x-5 gap-y-1 md:grid-cols-[150px_200px_1fr]">
              <code className="font-code text-[13px] font-semibold text-ink">{row.where}</code>
              <span className="flex items-center gap-2.5">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#efede8]" aria-hidden="true">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(row.count / most) * 100}%` }} />
                </span>
                <span className="w-9 text-right font-code text-[13px] text-ink">{row.count}</span>
              </span>
              <span className="text-[14px] leading-normal text-ink-soft">{row.what}</span>
            </li>
          ))}
        </ul>

        <h3 className="m-0 mt-14 font-display text-xl font-bold">How fast</h3>
        <p className={PROSE}>
          {code('npm run bench')}, on {BENCH.machine}: the invoice of the demo, with its computed values.
        </p>
        {table(['', 'Median', 'p95'], BENCH.rows)}

        <h3 className="m-0 mt-14 font-display text-xl font-bold">How big</h3>
        <p className={PROSE}>{code('npm run size')}, minified for the browser, Rebodocs’ engine in it.</p>
        {table(['', 'Minified', 'Gzipped'], SIZE.rows)}

        <h3 className="m-0 mt-14 font-display text-xl font-bold">Templates as Word writes them</h3>
        <p className={PROSE}>
          Word cuts a {code('{{variable}}')} into pieces as a person types it, with marks of spelling and bookmarks between them. A template with all of those, its XML made by hand, is read whole: its
          variables, their formats and the marks of its blocks.
        </p>

        <h3 className="m-0 mt-14 font-display text-xl font-bold">By hand</h3>
        <ul className="m-0 mt-5 grid max-w-[760px] list-disc gap-2.5 pl-5 text-base leading-[1.6] text-ink-soft">
          {BY_HAND.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list, drawn once
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="what-is-not" className="mt-24">
        <SectionHead id="what-is-not" badge="Untried" color="yellow" title="What is not" />
        <dl className="m-0 mt-6 max-w-[920px] rounded-2xl border border-border px-5">
          {NOT.map(([title, text]) => (
            <div key={title} className="grid gap-x-6 gap-y-1 border-t border-[#f0eee9] py-3.5 first:border-t-0 md:grid-cols-[260px_1fr]">
              <dt className="text-[15px] font-semibold text-ink">{title}</dt>
              <dd className="m-0 text-[15px] leading-normal text-ink-soft">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="known-limits" className="mt-24">
        <SectionHead id="known-limits" badge="Limits" color="orange" title="Known limits" />
        <div className="mt-6 grid max-w-[920px] gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))' }}>
          {LIMITS.map((group) => (
            <div key={group.area} className="rounded-2xl border border-border p-5">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${PASTEL_CLASS[group.color]}`}>{group.area}</span>
              <ul className="m-0 mt-3 grid list-none gap-2.5 p-0">
                {group.items.map((item, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list, drawn once
                  <li key={i} className="flex items-start gap-2.5 text-[15px] leading-[1.55] text-ink-soft">
                    <span aria-hidden="true" className="mt-2 size-1.5 flex-none rounded-full bg-[#c9c6bf]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="asked-of-rebodocs" className="mt-24">
        <SectionHead id="asked-of-rebodocs" badge="Rebodocs first" color="blue" title="Asked of Rebodocs">
          ReboTemplates fills templates with {link(REBODOCS, 'Rebodocs')}’ engine, through its public API only. What that API lacks is added there, and taken here with its next version.
        </SectionHead>
        <ul className="m-0 mt-6 grid max-w-[760px] list-disc gap-2.5 pl-6 text-base leading-[1.6] text-ink-soft">
          {ASKED.map(([lead, text]) => (
            <li key={lead}>
              <strong className="font-semibold text-ink">{lead}</strong> {text}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="roadmap" className="mt-24">
        <SectionHead id="roadmap" badge="Next" color="purple" title="Roadmap">
          In the order it is built.
        </SectionHead>
        <ol className="m-0 mt-6 grid max-w-[760px] list-decimal gap-2.5 pl-6 text-base leading-[1.6] text-ink-soft">
          {ROADMAP.map(([lead, text]) => (
            <li key={lead}>
              <strong className="font-semibold text-ink">{lead}</strong> {text}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="contributing" className="mt-24">
        <SectionHead id="contributing" badge="Help" color="blue" title="Contributing" />
        <p className={PROSE}>
          The repository’s {code('CONTRIBUTING.md')} says how to set up and what the conventions are, starting with <em>Rebodocs first</em>. Each package’s README ends with a list of where it can
          improve: good places to start.
        </p>
      </section>

      <section aria-labelledby="license" className="mt-24">
        <SectionHead id="license" badge="MIT" color="green" title="License" />
        <p className={PROSE}>MIT. Anyone may use it for anything, any company included.</p>
      </section>
    </>
  );
}
