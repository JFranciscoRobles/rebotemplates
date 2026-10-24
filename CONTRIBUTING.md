# Contributing

## Rebodocs first

ReboTemplates fills templates with the engine of Rebodocs (`@rebodocs/core`).
A change to how a template is filled (a format, a kind of block, pictures)
is a change to Rebodocs, made there with its tests, and taken here with the
next version of Rebodocs. Nothing in this repository reads or writes DOCX XML
itself, and nothing uses `@rebodocs/core/internal`: what the public API lacks
is added to it, in Rebodocs. ROADMAP.md says why.

What belongs here: the data before it is filled (values computed in code,
values missing, dates), the names and defaults of a generator (`render`,
`inspect`, `check`, `toPdf`), finding fonts, the command line, the assistant's
tools, the demo and the site.

## Trying a change of Rebodocs here

The tests run on the `@rebodocs/core` npm installed. To run them on a
checkout of Rebodocs instead, its source and not a release:

```bash
REBODOCS=../docs npm test
```

A test that needs what Rebodocs has not published yet is skipped on the
release and runs on the checkout (`test-templates/badge.test.ts`, for
pictures, says how).

## Setting up

```bash
npm install
npm test            # Vitest
npm run typecheck   # tsc, over every package
npm run lint        # Biome: the format and the lint rules, as biome.json says
npm run format      # Biome, writing
npm run bench       # how long the invoice takes, to DOCX and to PDF
```

The format is Biome's, 200 characters wide. Node 22.12 or later. The
repository is an npm workspace; packages import each other as source.

## Where things go

- What happens to the data before it is filled belongs in
  `packages/core/src/data.ts`, as a pure function with a test.
- What needs Node (files, fonts) belongs in `packages/pdf` or
  `packages/cli`, never in `core`, which runs in Workers and browsers too.
- A template a test needs is made in code, in `test-templates/`, with its
  data and what is expected out. Never a real document.

Each package's README ends with a list of where it can improve.

## Conventions

- **TypeScript, strict.** No `any`.
- **Comments say why, not what**, in plain English, in the voice of the ones
  already there.
- **No runtime dependencies** but `@rebodocs/core`.
- **No claim without a number.** Speed and size are said where `npm run
  bench` measured them, with the machine.

## Numbers

What is measured (`npm test`, `npm run bench`, `npm run size`) is said in two
places, changed together: "What is checked" in `ROADMAP.md`, and
`apps/site/components/docs/status/data.ts`, which the status page and the
landing read. Run the commands again and copy what they print, with the date.

## Publishing

Every package is built as Rebodocs builds its own (`tools/package.mjs`): its
code in files of its own, its types beside them, and a `package.json` of its
own in `dist/`, which is what goes to npm. The `package.json` beside the
sources stays the one the repository uses.

```bash
npm run build:packages                          # dist/ of every package
npm publish ./packages/core/dist                # then pdf, cli, in that order
```

Before a release: `npm test`, `npm run typecheck`, `npm run lint`; the
version of every package moved together; the heading of **Unreleased** in
`CHANGELOG.md` turned into the version and its date; `PUBLISHED` turned on in
`apps/site/lib/home.ts`.

## Files

**Never commit a real document or real data.** `/files/` is ignored by git
for that reason.

## Commits

One change per commit, with a message that says what changed and why.
