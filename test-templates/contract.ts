// A service contract: clauses kept or left out by the data, a clause in each
// of two versions ({{#…}} and {{^…}}), a list of deliverables as paragraphs
// that repeat, and the parties' names in capitals. Made in code; no real
// contract.

import { type Doc, type Paragraph, type RunProps, createDoc, exportDocx, setParagraphStyle } from '@rebodocs/core';

const TEXT: RunProps = { fontFamily: 'Calibri', fontSize: 11 };
const p = (text: string, props: RunProps = {}): Paragraph => ({ props: {}, runs: [{ text, props: { ...TEXT, ...props } }] });

export function contractDoc(): Doc {
  const doc = createDoc([
    p('Service agreement', { bold: true, fontSize: 18 }),
    p('Between {{provider.name | upper}} and {{client.name | upper}}, signed on {{signed | long date}}.'),
    p('1. Services'),
    p('The provider will deliver:'),
    p('{{#deliverables}}'),
    p('– {{deliverables.name}}, by {{deliverables.due | long date}}.'),
    p('{{/deliverables}}'),
    p('2. Payment'),
    p('The client will pay {{fee | currency}}{{#monthly}} each month{{/monthly}}.'),
    p('{{#confidential}}'),
    p('3. Confidentiality'),
    p('Each party keeps the other’s information confidential for {{confidential.years}} years after the end of this agreement.'),
    p('{{/confidential}}'),
    p('{{#exclusive}}'),
    p('The client may not hire another provider for these services while this agreement lasts.'),
    p('{{/exclusive}}'),
    p('{{^exclusive}}'),
    p('The client may hire other providers for these services.'),
    p('{{/exclusive}}'),
  ]);
  return setParagraphStyle(doc, 0, 0, 'Heading1');
}

export const contract = (): Uint8Array => exportDocx(contractDoc());

export const contractData = () => ({
  provider: { name: 'Acme Ltd.' },
  client: { name: 'Studio Lumen' },
  signed: '2026-10-24',
  fee: 1180,
  monthly: true,
  confidential: { years: 3 },
  exclusive: false,
  deliverables: [
    { name: 'A brand guide', due: '2026-11-15' },
    { name: 'Templates for invoices and letters', due: '2026-12-01' },
  ],
});
