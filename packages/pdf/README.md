<h1 align="center">@rebotemplates/pdf</h1>

<p align="center">
  A Word template filled with JSON and laid out as a PDF, with no browser. Node.
</p>

---

## Install

```bash
npm install @rebotemplates/pdf
```

## Usage

```ts
import { toPdf } from '@rebotemplates/pdf';

const { pdf, missing, missingFonts } = toPdf(template, data, {
  computed,
  locale: 'en-US',
  title: 'Invoice 0144',
  fonts: ['./fonts'], // folders or bytes, looked in before the system's
});
```

The layout is Rebodocs', measured line by line against Word; the PDF is
tagged for screen readers.

## Fonts

The fonts given, then those of the system (`/Library/Fonts`,
`/usr/share/fonts`, `C:\Windows\Fonts`…) whose file names look like the
families the document asks for, with Word's defaults and stand-ins.
`missingFonts` says the families none was found for: another was used. A
server without fonts (a container, a Worker) gives its own with `fonts`, and
`systemFonts: false` leaves the system out.

## Status

Tested in `test/pdf.test.ts`, on a machine with system fonts. Not on npm yet.

## Where it can improve

- **The families a document takes from its styles** are known only once a
  first layout says they are missing, which lays it out twice. Rebodocs'
  `resolveRun` would tell them first; it is not in its public API yet.
- **A set of free fonts** as a package, for servers without any.

## License

MIT
