<h1 align="center">@rebotemplates/cli</h1>

<p align="center">
  Render, inspect and check Word templates from the command line.
</p>

---

```bash
npx @rebotemplates/cli render invoice.docx invoice.json -o invoice.pdf
npx @rebotemplates/cli render invoice.docx invoices.jsonl -o "out/{number}.pdf"   # one per line
npx @rebotemplates/cli inspect invoice.docx
npx @rebotemplates/cli check invoice.docx invoice.json
```

| Option | What it does |
| --- | --- |
| `-o file` | Where to write: `.docx` or `.pdf`; with `{field}` for one per line. |
| `--locale en-US`, `--currency EUR` | How numbers, dates and money are written. |
| `--missing mark\|empty\|keep` | What to do with a value the data lacks. |
| `--strict` | Write nothing, and fail, when a value is missing or a format cannot write one. |
| `--computed file.mjs` | A module whose default export is the computed values. |
| `--fonts folder` | Fonts for the PDF, before the system's. |

Data comes from stdin when its file is `-`.

## Status

Tested in `test/cli.test.ts`, without a process of its own. Not on npm yet.

## Where it can improve

- **A build** (`dist/`) for `bin/rebotemplates.mjs`; in the repository,
  `npm run cli -- …` runs the source.
- **Watching a folder** of templates and data.

## License

MIT
