// A letter with dates written three ways, names in capitals and in capital
// letters at the start, and a postscript only for some. In Spanish, as a
// template written in another language than its code.

import { type Doc, type Paragraph, type RunProps, createDoc, exportDocx } from '@rebodocs/core';

const TEXT: RunProps = { fontFamily: 'Calibri', fontSize: 11 };
const p = (text: string): Paragraph => ({ props: {}, runs: [{ text, props: TEXT }] });

export function letterDoc(): Doc {
  return createDoc([
    p('{{city}}, {{sent | fecha larga}}'),
    p('Estimada {{recipient.name | capital}}:'),
    p('Le confirmamos su cita del {{appointment | fecha}} a nombre de {{recipient.name | upper}}.'),
    p('{{#ps}}P. D. {{ps}}{{/ps}}'),
    p('Atentamente, {{sender}}'),
  ]);
}

export const letter = (): Uint8Array => exportDocx(letterDoc());

export const letterData = () => ({
  city: 'Monterrey',
  sent: '2026-10-24',
  appointment: '2026-11-03',
  recipient: { name: 'ana ruiz' },
  sender: 'Acme Ltd.',
  ps: 'Traiga una identificación.',
});
