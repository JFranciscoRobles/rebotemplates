import { PUBLISHED } from '@/lib/home';
import { REBODOCS, REPO } from '@/lib/site';
import { LINK, MONO, PROSE } from '../styles';
import { Callout, Code, SectionHead } from '../ui';

const code = (text: string) => <code className={MONO}>{text}</code>;

/** The syntax, as the README has it: the Rebodocs syntax, the same in every product of the suite. */
const SYNTAX: [string, string][] = [
  ['{{client.name}}', 'A value; dotted for a field of an object.'],
  ['{{price | currency}}', 'A value in a format: currency, number, date, long date, full date, upper, lower, capital, bold, italic, underline. In Spanish too: moneda, fecha larga, mayúsculas…'],
  ['{{#items}} … {{/items}}', 'Repeated for each item of a list: text, a row of a table, or paragraphs, by where the marks are. Inside, {{items.name}}.'],
  ['{{#paid}} … {{/paid}}', 'Kept when the value is there: not empty, not false, not 0.'],
  ['{{^paid}} … {{/paid}}', 'Kept when it is not.'],
];

/**
 * "Getting started": installing; writing a template in Word; rendering it in
 * Node, with values computed in code; the PDF; checking before sending; the
 * command line; an assistant; the browser; and the repository.
 */
export function GettingStartedPage() {
  return (
    <>
      <h1 className="m-0 mt-3 font-display text-[clamp(36px,4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.03em]">Getting started</h1>
      <p className="m-0 mt-3.5 max-w-[700px] text-lg leading-[1.6] text-muted">
        A template written in Word, data as JSON, and back a .docx or a PDF: from installing it to a folder of documents made from the command line.
      </p>

      <section aria-labelledby="install" className="mt-16">
        <SectionHead id="install" badge="1" color="orange" title="Install" />
        <Code lang="bash">{'npm install @rebotemplates/core        # .docx\nnpm install @rebotemplates/pdf         # and PDF, in Node'}</Code>
        {!PUBLISHED && (
          <Callout title="Not on npm yet.">
            The packages are written and tested and come out with 0.1.0. Until then, they run from{' '}
            <a href={REPO} className={LINK}>
              the repository
            </a>
            , as its README says.
          </Callout>
        )}
        <p className={PROSE}>
          It needs nothing else from the Rebo suite; inside, it uses the engine of{' '}
          <a href={REBODOCS} className={LINK}>
            Rebodocs
          </a>
          , which comes with it.
        </p>
      </section>

      <section aria-labelledby="template" className="mt-20">
        <SectionHead id="template" badge="2" color="yellow" title="Write a template in Word">
          A template is an ordinary .docx with {code('{{variables}}')} typed in it, where the values go. Style it as any document: the result keeps it.
        </SectionHead>
        <div className="mt-6 max-w-[820px] overflow-x-auto rounded-2xl border border-border">
          <table className="w-full border-collapse text-left text-[15px]">
            <thead className="bg-surface text-[13px] text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Write</th>
                <th className="px-4 py-2.5 font-medium">For</th>
              </tr>
            </thead>
            <tbody>
              {SYNTAX.map(([write, what]) => (
                <tr key={write} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 font-code text-[13px] text-pastel-orange-fg">{write}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={PROSE}>
          A row that repeats has its marks in its first and last cells: {code('{{#items}}{{items.name}}')} in one, {code('{{items.amount | currency}}{{/items}}')} in the other. The same template opens
          in the Rebodocs editor with its variables, and one made there renders here.
        </p>
      </section>

      <section aria-labelledby="render" className="mt-20">
        <SectionHead id="render" badge="3" color="green" title="Render it in Node">
          One function: the template’s bytes and an object in, the .docx out, with what the data lacked.
        </SectionHead>
        <Code lang="ts">{`import { readFileSync, writeFileSync } from 'node:fs';
import { loadTemplate, render } from '@rebotemplates/core';

// Read once, render many times.
const template = loadTemplate(readFileSync('invoice.docx'));

const { docx, missing, problems } = render(template, data, {
  locale: 'en-US',
  currency: 'USD',
  // Worked out in code: the template says {{items.amount | currency}} and {{total | currency}}.
  computed: {
    'items.amount': (item) => item.qty * item.price,
    total: (_, data) => data.items.reduce((sum, item) => sum + item.qty * item.price, 0),
  },
});

writeFileSync('invoice-0144.docx', docx);`}</Code>
        <p className={PROSE}>
          A value the data lacks shows as {code('[client.city]')} in the document, and {code('missing')} lists it, as {code('items[2].price')} for the item it is in. {code("missing: 'empty'")} leaves
          it out instead, {code("missing: 'keep'")} keeps the {code('{{variable}}')} to fill later. A block the data names as {code('null')} or {code('false')} is left out quietly.
        </p>
      </section>

      <section aria-labelledby="pdf" className="mt-20">
        <SectionHead id="pdf" badge="4" color="pink" title="Make a PDF">
          The same template and data, laid out by Rebodocs as Word lays them out, with no browser and no LibreOffice.
        </SectionHead>
        <Code lang="ts">{`import { toPdf } from '@rebotemplates/pdf';

const { pdf, missingFonts } = toPdf(template, data, {
  computed,
  title: 'Invoice 0144',
  fonts: ['./fonts'], // folders or bytes, looked in before the system's
});`}</Code>
        <Callout title="Fonts.">
          The PDF needs the font files the document is set in. They are looked for in the folders given and then in the system’s; {code('missingFonts')} says the families none was found for, and
          another was used. A container or a Worker has none of its own: give them with {code('fonts')}.
        </Callout>
      </section>

      <section aria-labelledby="check" className="mt-20">
        <SectionHead id="check" badge="5" color="purple" title="Check before you send">
          What a template asks for, and what would go wrong with some data, before anything is made.
        </SectionHead>
        <Code lang="ts">{`import { check, inspect } from '@rebotemplates/core';

inspect(template, { computed });
// variables: number, client.name, … items.amount (computed), total (computed)
// blocks: { name: 'items', kind: 'row' }, { name: 'paid', kind: 'text' }

check(template, data, { computed });
// { ok: false, missing: ['client.city'], problems: [{ name: 'due', format: 'date', kind: 'value' }] }`}</Code>
      </section>

      <section aria-labelledby="cli" className="mt-20">
        <SectionHead id="cli" badge="6" color="blue" title="From the command line">
          One document, or one per line of a JSON lines file, named by its fields.
        </SectionHead>
        <Code lang="bash">{`npx @rebotemplates/cli inspect invoice.docx
npx @rebotemplates/cli check invoice.docx invoice.json --computed computed.mjs
npx @rebotemplates/cli render invoice.docx invoices.jsonl -o "invoices/{number}.pdf" --computed computed.mjs`}</Code>
        <p className={PROSE}>
          {code('computed.mjs')} is a module whose default export is the {code('computed')} of {code('render')}. {code('--strict')} writes nothing, and fails, when a value is missing.
        </p>
      </section>

      <section aria-labelledby="assistant" className="mt-20">
        <SectionHead id="assistant" badge="7" color="orange" title="With an assistant">
          {code('@rebotemplates/mcp')} gives Claude, or any client of the Model Context Protocol, a folder of templates: to list them, fill them, and turn a finished document into a new one.
        </SectionHead>
        <Code lang="json">{`{
  "mcpServers": {
    "rebotemplates": {
      "command": "npx",
      "args": ["-y", "@rebotemplates/mcp", "--dir", "/Users/me/templates"]
    }
  }
}`}</Code>
        <p className={PROSE}>
          In {code('claude_desktop_config.json')}. Then ask: <em>“Turn invoice-0142.docx into a template”</em>. Claude reads the invoice, proposes which texts become variables, which row repeats and
          which paragraph depends on a value, shows the template with {code('dry_run')}, and writes it as a new file once you agree. The invoice itself is not changed.
        </p>
      </section>

      <section aria-labelledby="browser" className="mt-20">
        <SectionHead id="browser" badge="8" color="purple" title="In the browser">
          {code('@rebotemplates/core')} has no DOM and no Node: it fills templates in a page or a Worker as on a server. The demo of the home page is it, filling the invoice on every keystroke.
        </SectionHead>
      </section>

      <section aria-labelledby="repository" className="mt-20">
        <SectionHead id="repository" badge="Repository" color="green" title="Run the repository" />
        <Code lang="bash">{`npm install
npm test            # Vitest
npm run bench       # how long the invoice takes, on this machine
npm run size        # what core weighs in a bundle
npm run demo        # the demo, at http://localhost:5191
npm run site        # this site, at http://localhost:5192`}</Code>
      </section>
    </>
  );
}
