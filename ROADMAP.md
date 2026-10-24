# ReboTemplates: roadmap

ReboTemplates is a document generator: a template written in Word, data as
JSON, and back a `.docx` or a PDF. This file says how the repository is laid
out, so that it is kept the way Rebodocs and ReboFiles are, what was decided
before the first line, and in what order the work goes. Its last part is also
the status page of the site (`apps/site/components/docs/status/`), with the
same sections as Rebodocs'; the two are changed together.

## Decided before the first line

### The engine is Rebodocs'

ReboTemplates does not have a template engine of its own. Filling a template
(variables, blocks that repeat, conditions, formats), checking it, and laying
it out as a PDF are already in `@rebodocs/core`, tested and measured against
Word. A second engine would mean a second DOCX reader and writer and a second
layout, and two products that disagree about the same file.

So `@rebotemplates/core` depends on `@rebodocs/core`, and is a small layer
over it: one function to render, one to inspect, one to check, with the
names and the defaults of a generator rather than of an editor. Both are free
and MIT, so the dependency costs no one anything; what it asks of us is
discipline:

- **Rebodocs first.** A change to how templates are filled (a format, a kind
  of block, pictures) goes into `@rebodocs/core`, with its tests there, and
  ReboTemplates takes it with the next version of Rebodocs. Nothing in this
  repository reads or writes DOCX XML itself.
- **Only the public API.** `@rebodocs/core`, never `@rebodocs/core/internal`.
  What ReboTemplates needs and the public API lacks is added to it, in
  Rebodocs.
- **Its own version.** ReboTemplates is released at a version of its own;
  each release says, in `CHANGELOG.md`, which version of `@rebodocs/core` it
  takes, and its `package.json` asks for that minor version (`~0.11.0`), not
  any.
- **Nothing else of the suite.** Not the editor, not collaboration, not
  ReboFiles. A person who installs ReboTemplates learns nothing else.

The copy of the landing says it as it is: *it needs nothing else from the
suite; inside, it uses the Rebodocs engine.* Not "it depends on no other
product", which would not be true.

### One syntax for the whole suite: Rebodocs'

A template made for ReboTemplates opens in Rebodocs, and its variables show
there as variables; one made in Rebodocs renders here. So there is one
syntax, the one Rebodocs already reads and writes, and the handoff's examples
are written in it:

| The handoff wrote | The suite writes | Why |
| --- | --- | --- |
| `{{client.name}}` | `{{client.name}}` | The same. |
| `{{#if paid}} … {{/if}}` | `{{#paid}} … {{/paid}}` | Rebodocs' blocks are a condition when the value is not a list; `{{^paid}}` is its "else". No second word to learn. |
| `{{#items}} … {{/items}}` | the same | Where the marks are says what repeats: text, a row of a table, or paragraphs. |
| `{{price \| money}}` | `{{price \| currency}}` | Rebodocs' name for it, with the currency and the language of the render. |
| `{{qty * price \| money}}` | `{{items.amount \| currency}}` | See below: values computed in code, not expressions in the document. |
| `{{total(items) \| money}}` | `{{total \| currency}}` | The same. |

No aliases: two ways to write one thing would be two things to document,
test and explain in Word's own interface.

### Values computed in code, not in the document

Expressions in a template (`{{qty * price}}`) are a language inside Word
that no one can test, and a door for whatever a template may ask a server to
evaluate. Instead, `render` takes `computed`: functions that add values to
the data before it is filled.

```ts
render(template, data, {
  computed: {
    'items.amount': (item) => item.qty * item.price,
    total: (data) => data.items.reduce((sum, item) => sum + item.qty * item.price, 0),
  },
});
```

The template says `{{items.amount | currency}}` and `{{total | currency}}`;
`inspect` lists them as computed, so a check does not call them missing.
This lives in ReboTemplates, as it is about data, not about documents.

### Pictures as a format

A picture is a variable with the format `image`: `{{logo | image}}`, or
`{{logo | image 4cm}}` for its width. Its value is the picture's bytes, a
`data:` address, or, with `fetchImages: true`, an address to fetch. In a
block, `{{items.photo | image 2cm}}` gives each row its own. It goes into
`@rebodocs/core` (`formatValue` and `fillVariables`), so the editor shows it
and fills it too.

## The repository

The same shape as `JFranciscoRobles/rebodocs` and as ReboFiles, piece for
piece.

| Rebodocs | ReboTemplates | What it holds |
| --- | --- | --- |
| `packages/core` | `packages/core` | `render`, `inspect`, `check` and `computed`, to DOCX. Runs anywhere: Node, Workers, the browser. Depends on `@rebodocs/core` only. |
| (in `core`) | `packages/pdf` | `toPdf`: the document laid out and written as a PDF, with the fonts given or found on the system. Node, as it reads font files. |
| `packages/mcp` (`rebodocs-generate`) | `packages/cli` | `rebotemplates render template.docx data.json -o out.pdf`, `inspect`, `check`; JSON from a file or from stdin, many at once from a JSON lines file. |
| `packages/mcp` | `packages/mcp` | A folder of templates for an assistant: list them, inspect one, render one, and turn a `.docx` into a template by marking its variables. |
| `apps/site` | `apps/site` | Next.js 16 and Tailwind 4: the landing of the handoff, the docs, the status page. |
| `apps/demo` | `apps/demo` | The three panes of the landing: the template, the JSON, the document, rendered by the real core in the browser. |
| `apps/playground` | `apps/playground` | `npm run dev`: a folder of templates on the disk, data typed beside them, the DOCX and the PDF made by the real packages. |
| `apps/storage` | `apps/server` | `POST /render` as plain Node: the example of a server of one's own, and what the docs copy. |
| `test-documents/` | `test-templates/` | Templates made in code (invoices, contracts, letters), each with its data and the text expected out. None from a real document. |
| `tools/` | `tools/` | `api-report.mjs`, `package.mjs`, `bench.ts`, copied as they are; `bench.ts` renders the invoice a thousand times. |

At the root, the same files: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`,
`LICENSE` (MIT), `THIRD_PARTY_NOTICES.md`, `biome.json` (200 wide),
`vitest.config.ts`, `tsconfig.json` (strict), and `package.json` as an npm
workspace of `packages/*` and `apps/*`, Node 22.12 or later, with the same
script names (`dev`, `demo`, `site`, `test`, `typecheck`, `lint`, `format`,
`api`, `bench`).

The same rules:

- **One version for every package**, its own and not Rebodocs'. Before 1.0
  a minor version may change the API, and `CHANGELOG.md` says what to do
  about it under **Changed**.
- **Each package's README** has the sections of Rebodocs' and ends with
  **Where it can improve**.
- **The status page** is `StatusPage.tsx` plus `data.ts`: the numbers, the
  tests and the timings of `npm run bench`, come from running the commands,
  with the date they were taken.
- **No claim without a number.** "Milliseconds", "small" and "serverless" go
  on the landing when `bench.ts` and a deploy have measured them, with the
  numbers beside them.

## What is checked

Taken on October 24, 2026, by running `npm test`, every one passing:

- `packages/mcp` · 11 · The protocol, listing, inspecting with data to fill in, checking, rendering a .docx and a PDF, paths outside the folder refused, a finished invoice turned into a template that makes the same documents as the one it came from, what is not found said.
- `packages/core` · 15 · Values missing (marked, empty, kept, a whole object, a block), 0 and false as values, computed values for each item and for the whole, lists inside lists, dates, `check` (a whole object missing included), `inspect`, a template read once.
- `packages/pdf` · 2 · The invoice as a PDF, and the families no font was found for.
- `packages/cli` · 6 · `inspect`, `check`, `render` from stdin, one document per line, `--strict`, names of files.
- `test-templates` · 10 · The invoice, a contract and a letter rendered and their text read back from the DOCX: rows of a table, paragraphs that repeat, clauses kept and left out, a clause in two versions, dates and names formatted, a letter written in Spanish with its formats named in Spanish. And a template as Word writes one, its XML made by hand: variables and the marks of blocks cut into runs, spelling marks and a bookmark between them, part of a name in bold.

### How fast and how big

`npm run bench`, Apple M1, Node 22.23: the invoice to DOCX in 0.7 ms (median, p95 1.0 ms) from a template loaded once and 1.1 ms from its bytes; to PDF in 3.3 ms (p95 5.3 ms); the first render of a process, 15 ms.

`npm run size`, minified for the browser, Rebodocs' engine in it: `render` 150 KB (47 KB gzipped); filling and the PDF, 196 KB (62 KB gzipped).

### By hand

The invoice rendered from the command line to a PDF, and the PDF looked at: the heading, PAID, the table with a row per item, the total.

The MCP server installed from its tarball in an empty project and spoken to over standard input and output, as Claude Desktop does: initialize, the tools listed, the templates listed, a PDF rendered; nothing but the protocol on standard output.

The demo driven in Chrome: the document filled again as the JSON changes (PAID, an item added, the total), a value missing marked, a JSON broken keeping the last document, a PDF made in the page with Carlito and looked at, a .docx made. The landing built as plain files and seen at the width of a desktop and of a phone, the demo working in its frame, with no errors in the page and no sideways scroll.

## What is not

- `A cold start in a Worker.` The size is measured; the time a Worker, a Vercel function or a Lambda takes to start with it is not.
- `Templates saved by Word itself.` The XML Word writes was made by hand from what Word is known to write; no file saved by Word, on Windows or a Mac, is among the tests yet.
- `A machine without fonts.` The PDF of `@rebotemplates/pdf` was made with the fonts of a Mac; the demo's, with the Carlito it carries.

## Known limits

Grouped as on Rebodocs' page, one pastel per area: **Templates** (blue),
**Data** (green), **PDF** (purple), **Size and speed** (yellow), **CLI**
(orange), **Packaging** (pink).

Known from the start, as they are Rebodocs':

- The PDF lays out text left to right only, without hyphenation (see
  Rebodocs' known limits).
- A value missing shows as `[path]` in plain text, not in colour.
- The PDF lays a document out twice when its styles ask for a family its
  runs do not name: the public API of Rebodocs does not say those first.

### Asked of Rebodocs

What ReboTemplates needs and `@rebodocs/core` does not have in its public API:

- **`{{name | image}}`**, for 0.2.
- **The font families a document uses**, as `resolveRun` knows them (it is
  internal), so a PDF is laid out once.
- **A format of colour**, to mark a value missing in pink as the demo does.

## Roadmap

In the order it is built. Each version is published to npm when its last
item is checked, and not before; until 0.1.0 is on npm, the landing shows no
install command.

### 0.1.0 · Template + JSON = document

1. ✅ **`core`:** `render(template, data, options)` to DOCX bytes, with
   `computed`, `locale` and `currency`; `inspect(template)`: the variables,
   blocks and formats, and which are computed; `check(template, data)`: what
   is missing or of the wrong kind, before anything is made. A value missing
   is left visible in the document as `[path]` unless `missing: 'empty'`.
2. ✅ **`pdf`:** `toPdf(template, data, options)`, with `fonts` given as files
   or found on the system, and what fonts were missing in the answer.
3. ✅ **`test-templates/`:** an invoice (the handoff's), a contract with
   conditional clauses, a letter in Spanish, and a template as Word writes
   one. Each rendered and its text compared with what is expected. The
   letter gets a picture in 0.2.
4. ✅ **`tools/bench.ts`:** the invoice to DOCX and to PDF, cold and warm, in
   Node; the size of what `core` carries, bundled (`tools/size.ts`).
5. ✅ **`cli`:** `render`, `inspect`, `check`, from files or stdin.
6. ✅ **`apps/demo`:** the three panes, the template made in code and rendered
   by the real core in the browser on every keystroke.
7. ✅ **`apps/site`:** the landing of the handoff, in the suite's syntax and
   with its numbers measured; Getting started; the status page
   (`components/docs/status/`, as Rebodocs').

What is left of 0.1.0 is publishing it. The builds are made
(`npm run build:packages`) and were installed from their tarballs in an
empty project, rendered a DOCX and a PDF there, ran the command and passed
a strict typecheck; what remains is `npm publish` and `PUBLISHED` turned on
in `apps/site/lib/home.ts` (CONTRIBUTING.md, "Publishing").

### 0.2.0 · Pictures, in Rebodocs first

8. **`{{name | image}}`** in `@rebodocs/core`: bytes, `data:` addresses, and
   addresses fetched when asked; a width; one per row in a block. Shown and
   filled in the Rebodocs editor too.
9. ReboTemplates takes that version of Rebodocs; the letter of
   `test-templates/` gets its logo.

### 0.3.0 · Assistants

Built before 0.2, which waits on Rebodocs.

10. ✅ **`mcp`:** a folder of templates: list, inspect, check, render.
11. ✅ **A `.docx` turned into a template:** the assistant reads it, proposes
    which texts are variables, and marks them; the person sees the changes
    before they are kept (`dry_run`), and the template is a new file. A row
    of a table repeats; paragraphs of a list do not yet.

### 0.4.0 · Where it runs

12. **Serverless, measured:** a Cloudflare Worker, a Vercel function and a
    Lambda rendering the invoice, with the time of a cold start and the size
    of the bundle on the status page.
13. **`apps/server`** as a container image, for a team that wants a service
    and no code.
14. **Fonts for a server without any:** a small set under free licences,
    as a package of its own, for the PDF.

### 1.0.0

15. **Use it in a real application,** and fix what that shows.
16. The API settled, and kept from then on.

## Contributing

`CONTRIBUTING.md` copied from Rebodocs' and changed where the packages
differ, with **Rebodocs first** at its top: a change to how a template is
filled is a pull request there.

## License

MIT. Anyone may use it for anything, any company included.
