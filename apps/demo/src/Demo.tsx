// Template + JSON = document: the template as Word has it, the data as JSON
// to change, and the document they make, filled again on every keystroke by
// @rebotemplates/core, the same a server runs. "Generate" makes the real
// file: the .docx, or the PDF laid out by Rebodocs in the page.

import { exportDocx } from '@rebodocs/core';
import { fill, inspect, loadTemplate } from '@rebotemplates/core';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { invoiceComputed, invoiceData, invoiceDoc } from '../../../test-templates/invoice';
import { DocView } from './DocView';
import { pdfOf } from './pdf';

const INK = '#2f2e2b';
const MUTED = '#6b6964';
const BORDER = '#eae8e3';
const BRAND = '#c2540a';

/** What "+ Add item" adds, in turn. */
const EXTRA = [
  { name: 'PDF fonts', qty: 1, price: 120 },
  { name: 'Support plan', qty: 6, price: 300 },
  { name: 'Storage (TB)', qty: 4, price: 25 },
];

const seed = () => JSON.stringify(invoiceData(), null, 2);

const pill = (background: string, color: string): CSSProperties => ({ background, color, borderRadius: 999, padding: '2px 9px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' });
const head: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: MUTED, borderBottom: '1px solid #f0eee9' };
const textButton: CSSProperties = { border: 0, background: 'none', padding: '6px 10px', borderRadius: 8, font: '500 13px Inter, sans-serif', color: INK, cursor: 'pointer', whiteSpace: 'nowrap' };
const page: CSSProperties = {
  background: '#fff',
  boxShadow: '0 2px 10px rgba(47,46,43,.12)',
  borderRadius: 4,
  padding: '26px 28px',
  fontFamily: 'Calibri, Carlito, Arial, sans-serif',
  fontSize: 12.5,
  lineHeight: 1.55,
  color: INK,
};

export function Demo({ claudeActivity = true }: { claudeActivity?: boolean }) {
  const template = useMemo(() => loadTemplate(exportDocx(invoiceDoc())), []);
  const found = useMemo(() => inspect(template, { computed: invoiceComputed }), [template]);
  const [json, setJson] = useState(seed);
  const [format, setFormat] = useState<'docx' | 'pdf'>('pdf');
  const [extra, setExtra] = useState(0);
  const [toast, setToast] = useState('');
  const [claude, setClaude] = useState(false);

  // The data as typed, or the error that keeps it from being read; the document keeps the last that was.
  const parsed = useMemo(() => {
    try {
      return { data: JSON.parse(json) as Record<string, unknown>, error: '' };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }, [json]);
  const [last, setLast] = useState<Record<string, unknown>>(() => JSON.parse(seed()));
  useEffect(() => {
    if (parsed.data) setLast(parsed.data);
  }, [parsed.data]);

  const filled = useMemo(() => {
    const start = performance.now();
    const out = fill(template, last, { computed: invoiceComputed, locale: 'en-US', currency: 'USD' });
    return { ...out, ms: performance.now() - start };
  }, [template, last]);

  useEffect(() => {
    if (!claudeActivity) return;
    const timer = setTimeout(() => setClaude(true), 3000);
    return () => clearTimeout(timer);
  }, [claudeActivity]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const change = (edit: (data: Record<string, unknown>) => void) => {
    const data = structuredClone(parsed.data ?? last);
    edit(data);
    setJson(JSON.stringify(data, null, 2));
  };

  const number = String(last.number ?? 'draft');
  const file = `invoice-${number}.${format}`;
  const lines = Array.isArray(last.items) ? last.items.length : 0;
  const loops = found.blocks.filter((block) => block.kind !== 'text' && !block.inverted).length;
  const conditions = found.blocks.length - loops;
  const asked = found.variables.filter((variable) => !variable.computed).length;

  const generate = async () => {
    const start = performance.now();
    const bytes = format === 'pdf' ? await pdfOf(filled.doc, `Invoice ${number}`) : exportDocx(filled.doc);
    const ms = performance.now() - start + filled.ms;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    link.download = file;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setToast(`Generated ${file} in ${Math.max(1, Math.round(ms))} ms${filled.missing.length ? ` — ${filled.missing.length} missing values marked` : ''}`);
  };

  return (
    <div style={{ position: 'relative', fontFamily: 'Inter, system-ui, sans-serif', color: INK }}>
      <div
        style={{
          height: 600,
          minWidth: 980,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          boxShadow: '0 30px 60px -20px rgba(47,46,43,.18), 0 2px 6px rgba(47,46,43,.05)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <strong style={{ fontSize: 14 }}>invoice.docx</strong>
          <span style={pill('#fcebdd', '#a4521c')}>
            {asked} variables · {loops} loop{loops === 1 ? '' : 's'} · {conditions} condition{conditions === 1 ? '' : 's'}
          </span>
          <span style={{ flex: 1 }} />
          {/* biome-ignore lint/a11y/useSemanticElements: two buttons that switch one setting, as in ReboFiles' list and grid */}
          <div role="group" aria-label="Format" style={{ display: 'flex', border: '1px solid #dddad3', borderRadius: 999, overflow: 'hidden' }}>
            {(['docx', 'pdf'] as const).map((one) => (
              <button
                key={one}
                type="button"
                aria-pressed={format === one}
                onClick={() => setFormat(one)}
                style={{
                  border: 0,
                  padding: '6px 14px',
                  font: '600 12px Inter, sans-serif',
                  cursor: 'pointer',
                  background: format === one ? '#fcebdd' : '#fff',
                  color: format === one ? '#a4521c' : MUTED,
                }}
              >
                {one.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={!parsed.data}
            style={{
              border: 0,
              borderRadius: 10,
              padding: '9px 16px',
              background: BRAND,
              color: '#fff',
              font: '600 13px Inter, sans-serif',
              cursor: parsed.data ? 'pointer' : 'default',
              opacity: parsed.data ? 1 : 0.45,
            }}
          >
            Generate
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,0.9fr) minmax(0,1.1fr)' }}>
          <section aria-label="Template" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: `1px solid ${BORDER}` }}>
            <div style={head}>1 · Template, written in Word</div>
            <div style={{ flex: 1, overflow: 'auto', background: '#f7f6f3', padding: 16 }}>
              <div style={{ ...page, padding: '22px 20px', fontSize: 11.5 }}>
                <DocView doc={template.doc} marks="tokens" />
              </div>
            </div>
          </section>

          <section aria-label="Data" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: `1px solid ${BORDER}` }}>
            <div style={head}>
              2 · Data, as JSON
              <span style={{ flex: 1 }} />
              {parsed.data ? <span style={pill('#e7f3ea', '#2e6b3c')}>Valid</span> : <span style={pill('#fbe8ef', '#a23a5e')}>Error</span>}
            </div>
            <textarea
              aria-label="Data, as JSON"
              spellCheck={false}
              value={json}
              onChange={(event) => setJson(event.target.value)}
              style={{ flex: 1, minHeight: 0, resize: 'none', border: 0, outline: 'none', padding: '12px 14px', font: "12.5px/1.65 'JetBrains Mono', ui-monospace, monospace", color: INK }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px', borderTop: '1px solid #f0eee9' }}>
              <button
                type="button"
                style={textButton}
                onClick={() => {
                  change((data) => {
                    data.items = [...(Array.isArray(data.items) ? data.items : []), EXTRA[extra % EXTRA.length]];
                  });
                  setExtra(extra + 1);
                }}
              >
                + Add item
              </button>
              <button type="button" style={textButton} onClick={() => change((data) => (data.paid = !data.paid))}>
                Toggle paid
              </button>
              <span style={{ flex: 1 }} />
              <button type="button" style={{ ...textButton, color: MUTED }} onClick={() => (setJson(seed()), setExtra(0))}>
                Reset
              </button>
            </div>
          </section>

          <section aria-label="Output" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={head}>
              3 · Output, {format.toUpperCase()}
              <span style={{ flex: 1 }} />
              {filled.missing.length > 0 && (
                <span style={pill('#fbe8ef', '#a23a5e')} title={filled.missing.join(', ')}>
                  {filled.missing.length} missing
                </span>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: '#f1f0ec', padding: 16 }}>
              <div style={{ ...page, maxWidth: 400, margin: '0 auto' }}>
                <DocView doc={filled.doc} marks="missing" numbers={[1, 2, 3]} />
              </div>
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', gap: 12, padding: '7px 14px', borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED }}>
          <span style={{ flex: 1, color: parsed.data ? MUTED : '#a23a5e' }}>
            {parsed.data ? `${file} · ${lines} line${lines === 1 ? '' : 's'} · rendered in ${filled.ms < 1 ? '<1' : Math.round(filled.ms)} ms` : `JSON error: ${parsed.error}`}
          </span>
          <span>Same engine in the browser and in Node</span>
        </div>
      </div>

      {claude && (
        <div
          role="status"
          style={{
            position: 'absolute',
            right: -12,
            bottom: -22,
            width: 280,
            padding: '12px 14px',
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 16px 36px rgba(47,46,43,.14)',
            fontSize: 14,
            animation: 'rt-pop .5s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          <style>{'@keyframes rt-pop { from { opacity: 0; transform: translateY(8px); } } @media (prefers-reduced-motion: reduce) { [role=status] { animation: none !important; } }'}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: '#fcebdd', color: '#a4521c', fontWeight: 700 }}>C</span>
            <span style={{ flex: 1 }}>Claude · via MCP</span>
            <button type="button" aria-label="Close" onClick={() => setClaude(false)} style={{ border: 0, background: 'none', cursor: 'pointer', color: '#9b9890', fontSize: 18, lineHeight: 1 }}>
              ×
            </button>
          </div>
          <div
            style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45, color: '#4a4843' }}
          >{`Turned invoice-0142.docx into this template: ${asked} variables, one repeating table and a PAID condition.`}</div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', background: INK, color: '#fff', fontSize: 14, borderRadius: 12, padding: '12px 18px', zIndex: 10 }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
