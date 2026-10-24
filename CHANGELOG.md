# Changelog

Every package of ReboTemplates is released at the same version, its own and
not Rebodocs'; each release says which version of `@rebodocs/core` it takes.
Before 1.0, a minor version (0.x.0) may change the API; such changes are
listed under **Changed** with what to do about them.

## Unreleased

Takes `@rebodocs/core` 0.11.

### Added

- **`@rebotemplates/core`.** `render(template, data, options)` gives a .docx;
  `fill` gives the document, for anything else Rebodocs does with one;
  `check` says what would go wrong before anything is made; `inspect` lists
  the variables, their formats and blocks; `loadTemplate` reads a template
  once to fill it many times. `computed` works values out in code, for each
  item of a list (`'items.amount'`) or for the whole (`total`), lists inside
  lists included. A value the data lacks shows as `[path]` and is said, as
  `items[2].price` for the item it is in (`missing: 'empty'` or `'keep'`
  otherwise); a block without a value is taken as not there rather than
  leaving its marks. Dates may be given as `Date`.
- **`@rebotemplates/pdf`.** `toPdf`, with the fonts given (bytes or folders)
  and the system's, and the families no font was found for.
- **`@rebotemplates/cli`.** `rebotemplates render`, `inspect` and `check`;
  data from a file or stdin; one document per line of a `.jsonl` file, named
  by its fields (`-o "out/{number}.pdf"`); `--computed module.mjs`;
  `--strict` writes nothing when a value is missing.
- **`test-templates/invoice.ts`**, the handoff's invoice in the suite's
  syntax, and **`npm run bench`**.
- **The demo** (`npm run demo`): the three panes of the landing, the
  template, its data as JSON and the document, filled by the real core on
  every keystroke, a value missing marked in pink. "Generate" makes the real
  .docx, or the PDF laid out in the page with Carlito for Calibri. The
  invoice of `test-templates/` is set in Calibri, its PAID in green.
- **The landing page** (`apps/site`, `npm run site`): the design of the
  handoff in Next.js 16 and Tailwind 4, laid out as Rebodocs' and ReboFiles'
  sites are, with the demo in its frame. In the suite's syntax; its timings
  are those of `npm run bench`; what is not written yet says the version it
  comes in; no command to install until the packages are on npm.
- **More templates in `test-templates/`:** a contract (clauses kept and left
  out, a clause in two versions, paragraphs that repeat) and a letter written
  in Spanish; and a template as Word writes one, its variables cut into runs
  with spelling marks and a bookmark between them, read whole.
- **`npm run size`:** what core weighs in a bundle.
- **The documentation on the site:** Getting started, and the status page
  with the tests, timings and size as they were taken
  (`components/docs/status/`, as Rebodocs'). The landing's links go there.

- **`@rebotemplates/mcp`**, an MCP server over a folder of templates:
  `list_templates`, `inspect_template` (with data of the right shape to fill
  in), `check_data`, `render_document` (.docx or PDF, never over a file
  unless asked), and `make_template`, which turns a finished document into a
  template as a new file: texts become variables, a row of a table repeats
  for each item of a list, paragraphs are kept only when a value is there;
  `dry_run` shows it first. JSON-RPC over standard input and output, as
  Rebodocs' server speaks it, with no SDK. `npm run mcp -- --dir folder`.

- **`make_template` makes lists of paragraphs**, as it makes rows of a
  table: `lists` repeats one paragraph or several (`to`) for each item, the
  other items taken out. A condition may hold several paragraphs (`to`) or a
  text inside one (`inline`), and a variable may be told from the same text
  elsewhere by a longer one around it (`in`). A finished contract turned into
  a template makes the same contracts as the one it came from.

- **Pictures**, `{{logo | image}}`, made in Rebodocs first and published in
  its 0.11. Here, a picture may be given as its
  bytes, which `render` and `check` turn into a `data:` address;
  `resolvePictures` loads them from paths (or anything else, with a loader of
  one's own) and `fetchPictures` from the web. `inspect` says which variables
  are pictures. The command line reads a picture by its path, from the folder
  of the data, or fetches its address; the MCP server reads it by its path in
  its folders, and fetches nothing. A value that is not a picture is said
  as such. `test-templates/badge.ts`: a logo in the header and a photo in
  each row. `REBODOCS=../docs npm test` runs the tests on a checkout of
  Rebodocs.

### Changed

- A block the data names as `null`, `false` or `''` is no longer said to be
  missing: only one it does not name at all is.
- **Builds to publish** (`npm run build:packages`), made as Rebodocs makes
  its own: each package's `dist/` is the package, with its types, and was
  installed from its tarball in an empty project and used there.

### Fixed

- **`check` and a whole object missing.** A value inside an object the data
  does not have (`client.name` with no `client`) is said to be missing by
  `check` too, as `render` already said it.

