// A template as Word writes one, not as Rebodocs does: its XML made by hand
// with what Word puts in when a person types a variable and saves. A
// {{variable}} cut into several runs (Word starts a new one at each edit, each
// spelling mark, each change of language), marks of spelling between them, a
// bookmark inside one, part of a name in bold, and the marks of a block cut
// too. Rebodocs never writes these; Word always does.

import { strToU8, zipSync } from 'fflate';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const run = (text: string, props = '', rsid = '') => `<w:r${rsid ? ` w:rsidR="${rsid}"` : ''}>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${text}</w:t></w:r>`;
const p = (...inside: string[]) => `<w:p w:rsidR="00A11B22" w:rsidRDefault="00A11B22">${inside.join('')}</w:p>`;

const BODY = [
  // A name cut by the spelling marks around "client", and a run for the comma.
  p(run('Dear '), run('{{', '', '00B2C3D4'), '<w:proofErr w:type="spellStart"/>', run('client', '', '00C3D4E5'), '<w:proofErr w:type="spellEnd"/>', run('.name}}'), run(',')),
  // A bookmark inside the braces, part of the name in bold, the format in another language.
  p(run('Total: '), run('{{'), '<w:bookmarkStart w:id="0" w:name="_GoBack"/>', run('total', '<w:b/>'), '<w:bookmarkEnd w:id="0"/>', run(' | currency}}', '<w:lang w:val="es-MX"/>')),
  // The marks of a block cut, and a page break Word remembers where it drew it.
  p(run('{{#'), run('paid'), run('}}'), '<w:r><w:lastRenderedPageBreak/><w:t>PAID</w:t></w:r>', run('{{/'), run('paid}}')),
  // A list in a table of one row, as Word writes it.
  `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr>${[
    p(run('{{#items}}{{'), run('items.name'), run('}}')),
    p(run('{{items.price'), run(' | currency}}{{/items}}')),
  ]
    .map((cell) => `<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr>${cell}</w:tc>`)
    .join('')}</w:tr></w:tbl>`,
  p(),
];

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${BODY.join('')}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;

const TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

export const wordTemplate = (): Uint8Array => zipSync({ '[Content_Types].xml': strToU8(TYPES), '_rels/.rels': strToU8(RELS), 'word/document.xml': strToU8(DOCUMENT) });

export const wordData = () => ({
  client: { name: 'Northwind S.A.' },
  total: 4818,
  paid: true,
  items: [
    { name: 'Design sprint', price: 3600 },
    { name: 'Translations', price: 630 },
  ],
});
