# Demo

Template + JSON = document, in the browser: the invoice of
`test-templates/` as Word has it, its data as JSON to change, and the
document they make, filled again on every keystroke by `@rebotemplates/core`,
the same a server runs. It is the one on the landing.

```bash
npm run demo    # from the root: http://localhost:5191
```

"Generate" makes the real file: the .docx, or the PDF laid out by Rebodocs in
the page, with Carlito (`public/fonts`, SIL Open Font License) standing in
for Calibri, whose measures it has. The panes draw the documents as HTML
(`src/DocView.tsx`): their text and tables, not Word's layout, which the PDF
has.

Claude's card says what `make_template` of `@rebotemplates/mcp` does to a
finished invoice; nothing is asked of an assistant here. `?claude=0` leaves it out.

`Demo` is the component the landing puts in its frame.
