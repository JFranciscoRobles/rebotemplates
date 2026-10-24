<h1 align="center">@rebotemplates/core</h1>

<p align="center">
  Fill a Word template with JSON and get a .docx back: render, inspect and check, with values computed in code. Runs anywhere; uses the Rebodocs engine inside.
</p>

---

## Install

```bash
npm install @rebotemplates/core
```

## Usage

```ts
import { render, check, inspect, loadTemplate } from '@rebotemplates/core';

const template = loadTemplate(bytes); // read once, fill many times

check(template, data, { computed }); // { ok, missing: ['client.city'], problems: [] }
inspect(template); // the variables, their formats, the blocks

const { docx, missing, problems } = render(template, data, {
  locale: 'es-MX',
  currency: 'MXN',
  computed: { 'items.amount': (item) => item.qty * item.price },
});
```

## What is in it

| Function | What it does |
| --- | --- |
| `render` | The template filled, as a .docx, with what the data lacked and what a format could not write. |
| `fill` | The same, as a Rebodocs document, for `toPdf` or anything else Rebodocs does with one. |
| `check` | What would go wrong, before anything is made. |
| `inspect` | The variables with their formats, uses and block, and the blocks with what they repeat. |
| `loadTemplate` | A template read once. Filling from bytes reads it each time. |

`computed` takes functions by path: one for each item where a step of the
path is a list (`'orders.lines.total'`), given the item and the whole data.

## Status

Tested in `test/core.test.ts` and through `test-templates/`. Not on npm yet.

## Where it can improve

- **Pictures** (`{{logo | image}}`), which go into Rebodocs first.
- **Missing values marked in colour**, not only as `[path]`: needs a format
  of colour in Rebodocs.
- **Its size in a bundle**, not measured yet: `@rebodocs/core` is the size
  of an editor's engine.

## License

MIT
