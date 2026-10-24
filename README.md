<h1 align="center">ReboTemplates</h1>

<p align="center">
  A document generator: a template written in Word, data as JSON, and back a .docx or a PDF.<br>
  Variables, repeating tables, conditions and formats, rendered on your server. Free for any company.
</p>

---

ReboTemplates needs nothing else from the Rebo suite; inside, it uses the
engine of [Rebodocs](https://www.rebodocs.com), the one measured against
Word, so a template made here opens in the Rebodocs editor with its
variables, and one made there renders here. No headless browser, no
LibreOffice.

It is early: `core`, `pdf`, `cli`, `mcp`, the demo and the landing are written and tested, nothing is on
npm yet. [ROADMAP.md](ROADMAP.md) says what was decided, what is next and
what is checked.

## Quick start

A template is a .docx with `{{variables}}` in it, written in Word:

```text
Invoice {{number}}
Billed to {{client.name}}, {{client.city}}.
{{#paid}}PAID{{/paid}}
| {{#items}}{{items.name}} | {{items.qty}} | {{items.price | currency}} | {{items.amount | currency}}{{/items}} |
Total {{total | currency}}
```

```ts
import { render } from '@rebotemplates/core';
import { toPdf } from '@rebotemplates/pdf';

const options = {
  locale: 'en-US',
  currency: 'USD',
  // Worked out in code, not written as expressions in the document.
  computed: {
    'items.amount': (item) => item.qty * item.price,
    total: (_, data) => data.items.reduce((sum, item) => sum + item.qty * item.price, 0),
  },
};

const { docx, missing } = render(template, data, options); // a .docx, and what the data lacked
const { pdf } = toPdf(template, data, options); // the same, laid out as a PDF
```

```bash
rebotemplates render invoice.docx invoice.json -o invoice.pdf --computed computed.mjs
```

## The syntax

The Rebodocs syntax, the same in every product of the suite.

| Write | For |
| --- | --- |
| `{{client.name}}` | A value; dotted for a field of an object. |
| `{{price \| currency}}` | A value in a format: `currency`, `number`, `date`, `dateLong`, `upper`, `lower`, `capital`, `bold`… |
| `{{#items}} … {{/items}}` | Repeated for each item of a list: text, a row of a table, or paragraphs, by where the marks are. Inside, `{{items.name}}`. |
| `{{#paid}} … {{/paid}}` | Kept when the value is there: not empty, not false, not 0. |
| `{{^paid}} … {{/paid}}` | Kept when it is not. |
| `{{logo \| image: 4cm}}` | A picture, at the width given or its own; its value the bytes of a PNG, a JPEG or a GIF, a path or a URL (`resolvePictures`, `fetchPictures`), or a `data:` address. |

A value the data lacks shows as `[path]` in the document, and `render` says
which (`missing: 'empty'` or `'keep'` to do otherwise). A block the data does
not name is left out and said; one given as `null`, `false` or `''` is left
out quietly, as a postscript a letter may not have.

## Packages

| Package | What it is | Runs in |
| --- | --- | --- |
| [`@rebotemplates/core`](packages/core) | `render`, `inspect`, `check`, `fill`, with values computed in code. | Anywhere, no DOM |
| [`@rebotemplates/pdf`](packages/pdf) | `toPdf`, with fonts given or found on the system. | Node |
| [`@rebotemplates/cli`](packages/cli) | `render`, `inspect` and `check` from the command line, one document or one per line of a JSON lines file. | CLI |
| [`@rebotemplates/mcp`](packages/mcp) | A folder of templates for an AI assistant, and a finished .docx turned into a template. | MCP |

## How fast, how big

`npm run bench`, on an Apple M1 with Node 22, the invoice above: a .docx in
0.7 ms (median) from a template loaded once, 1.2 ms from its bytes, a PDF in
4.4 ms; the first render of a process, 15 ms.

`npm run size`, minified for the browser with Rebodocs' engine in it:
`render` is 155 KB (49 KB gzipped); filling and the PDF, 201 KB (64 KB).

Templates saved by Word cut a `{{variable}}` into pieces, with spelling marks
and bookmarks between them; they are read whole (`test-templates/word.ts`).

## Development

```bash
npm install
npm test            # Vitest
npm run typecheck   # tsc
npm run lint        # Biome
npm run bench       # the timings above, on this machine
npm run size        # what core weighs in a bundle
npm run demo        # the three panes of the landing, at http://localhost:5191
npm run site        # the landing page, at http://localhost:5192 (npm run build:site makes it static, in apps/site/out)
npm run sample -- folder              # the invoice as files: invoice.docx, invoice.json, computed.mjs
npm run cli -- render folder/invoice.docx folder/invoice.json -o out.pdf --computed folder/computed.mjs
```

[CONTRIBUTING.md](CONTRIBUTING.md) has where things go, and **Rebodocs first**.

## License

MIT. Anyone may use it for anything, any company included.
