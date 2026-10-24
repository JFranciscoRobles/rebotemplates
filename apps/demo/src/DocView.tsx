// A Rebodocs document drawn as HTML, for the panes of the demo: its
// paragraphs with the look of their runs, and its tables. Not Word's layout,
// which the PDF has; enough to see what the template and the data made.
// `marks` says what to pick out in the text: the {{tokens}} of a template, or
// the [paths] a filled document left for values missing.

import type { Doc, Paragraph, Run } from '@rebodocs/core';
import type { CSSProperties, ReactNode } from 'react';

const TOKEN = /(\{\{[^}]+\}\})/;
const MISSING = /(\[[\w.]+\])/;

const chip = (background: string, color: string): CSSProperties => ({
  background,
  color,
  borderRadius: 4,
  padding: '1px 5px',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: '0.86em',
  fontWeight: 400,
  // At the spaces of `| currency` first, and inside a name only when it must.
  overflowWrap: 'break-word',
});

function pieces(text: string, marks: 'tokens' | 'missing'): ReactNode[] {
  return text.split(marks === 'tokens' ? TOKEN : MISSING).map((piece, i) => {
    if (i % 2 === 0) return piece;
    // A value missing in pink; in a template, the marks of a block (#, ^, /) in grey and values in the brand's orange.
    const style = marks === 'missing' ? chip('#fbe8ef', '#a23a5e') : /^\{\{[#^/]/.test(piece) ? chip('#f1f0ec', '#6b6964') : chip('#fcebdd', '#a4521c');
    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: the pieces of one text, cut the same way each time it is drawn
      <span key={i} style={style}>
        {piece}
      </span>
    );
  });
}

function RunView({ run, marks }: { run: Run; marks: 'tokens' | 'missing' }) {
  const { bold, italic, underline, color, fontSize } = run.props;
  const style: CSSProperties = {
    fontWeight: bold ? 700 : undefined,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: underline ? 'underline' : undefined,
    color: color ? `#${color}` : undefined,
  };
  if (fontSize) style.fontSize = `${fontSize / 11}em`;
  return <span style={style}>{pieces(run.text, marks)}</span>;
}

const ParagraphView = ({ p, marks }: { p: Paragraph; marks: 'tokens' | 'missing' }) => (
  <p style={{ margin: '0 0 6px', minHeight: '1.2em' }}>
    {p.runs.map((run, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: the runs of one paragraph, drawn once
      <RunView key={i} run={run} marks={marks} />
    ))}
  </p>
);

export function DocView({ doc, marks, numbers = [] }: { doc: Doc; marks: 'tokens' | 'missing'; numbers?: number[] }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < doc.paragraphs.length; ) {
    const p = doc.paragraphs[i];
    if (!p.cell) {
      out.push(<ParagraphView key={i} p={p} marks={marks} />);
      i++;
      continue;
    }
    // A table: its paragraphs follow each other, row by row and cell by cell. A template's shares its width
    // evenly, as its long {{tokens}} would otherwise push it past the page.
    const table = doc.tables![p.cell.table];
    const start = i;
    while (i < doc.paragraphs.length && doc.paragraphs[i].cell?.table === p.cell.table) i++;
    const inside = doc.paragraphs.slice(start, i);
    out.push(
      <table key={start} style={{ width: '100%', tableLayout: marks === 'tokens' ? 'fixed' : 'auto', borderCollapse: 'collapse', margin: '10px 0 12px', fontSize: '0.95em' }}>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={row.id}>
              {row.cells.map((cell, c) => {
                const paras = inside.filter((q) => q.cell!.row === row.id && q.cell!.cell === cell.id);
                return (
                  <td
                    key={cell.id}
                    style={{
                      padding: '5px 6px',
                      borderBottom: r === 0 ? '1.5px solid #2f2e2b' : '1px solid #eae8e3',
                      textAlign: numbers.includes(c) ? 'right' : 'left',
                      fontVariantNumeric: 'tabular-nums',
                      verticalAlign: 'top',
                    }}
                  >
                    {paras.map((q, k) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: the paragraphs of one cell, drawn once
                      <span key={k} style={{ display: 'block' }}>
                        {q.runs.map((run, j) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: the runs of one paragraph, drawn once
                          <RunView key={j} run={run} marks={marks} />
                        ))}
                      </span>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>,
    );
  }
  return <>{out}</>;
}
