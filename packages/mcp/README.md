<h1 align="center">@rebotemplates/mcp</h1>

<p align="center">
  A folder of Word templates for an AI assistant: list, inspect, check and render them, and turn a finished .docx into a template. An MCP server.
</p>

---

## With Claude Desktop

In `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rebotemplates": {
      "command": "npx",
      "args": ["-y", "@rebotemplates/mcp", "--dir", "/Users/me/templates"]
    }
  }
}
```

`--dir` is the folder of templates, where relative paths start; `--out`
names other folders documents may be written to, `--fonts` folders of fonts
for PDFs. Nothing is read or written outside them.

## The tools

| Tool | What it does |
| --- | --- |
| `list_templates` | The .docx in the folder, each with how many variables and blocks it has. |
| `inspect_template` | Its variables, formats and blocks, and data of the right shape to fill in. |
| `check_data` | What would go wrong with some data: values missing, values a format cannot write. |
| `render_document` | The template filled, as a .docx or a PDF, written in the folder. Never over a file unless `overwrite`. |
| `make_template` | A finished document turned into a template, as a new file: texts that become variables, a row of a table or paragraphs repeated for each item of a list, paragraphs or a text inside one kept only when a value is there. `dry_run` shows it without writing. |

Each change of `make_template` is found by its exact text, and what is not
found is said rather than guessed; a short text that is in several places
is told apart by a longer one around it (`"in": "for 3 years"`). The
document it comes from is never changed.

It speaks JSON-RPC over standard input and output, a message a line, as
Rebodocs' own MCP server does, with no SDK.

## Status

Tested through the protocol in `test/mcp.test.ts`, with a finished invoice
and a finished contract each turned into a template that makes the same
documents as the one it came from: the rows of a table, a list of
deliverables, a clause of two paragraphs, a text inside a paragraph, a
number told from the same number elsewhere. Not on npm yet.

## Where it can improve

- **Over HTTP**, for an assistant that is not on the same machine.
- **Reading a document** to propose the marks: today the assistant reads it
  with other tools (Rebodocs' `read_document`) or from its text.

## License

MIT
