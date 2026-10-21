import { ReportDocument } from './report-document';
// pdfmake en Node: impresora del lado servidor con las fuentes Roboto embebidas.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/src/printer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const vfsModule = require('pdfmake/build/vfs_fonts.js');

const vfs: Record<string, string> = vfsModule.pdfMake ? vfsModule.pdfMake.vfs : vfsModule;
const font = (name: string) => Buffer.from(vfs[name], 'base64');
const printer = new PdfPrinter({
  Roboto: {
    normal: font('Roboto-Regular.ttf'),
    bold: font('Roboto-Medium.ttf'),
    italics: font('Roboto-Italic.ttf'),
    bolditalics: font('Roboto-MediumItalic.ttf'),
  },
});

const PRIMARY = '#0F4C5C';

export function renderPdf(doc: ReportDocument): Promise<Buffer> {
  const content: unknown[] = [];
  doc.sections.forEach((section, i) => {
    if (i > 0 && section.signatures) content.push({ text: '', pageBreak: 'before' });
    if (section.heading) content.push({ text: section.heading, style: 'h2', margin: [0, i === 0 ? 0 : 12, 0, 2] });
    if (section.subheading) content.push({ text: section.subheading, style: 'muted', margin: [0, 0, 0, 6] });
    const body = [
      section.columns.map((c) => ({ text: c.label, style: 'th', alignment: c.align ?? 'left' })),
      ...section.rows.map((r) => section.columns.map((c) => ({ text: r[c.key] == null ? '' : String(r[c.key]), alignment: c.align ?? 'left' }))),
    ];
    if (section.totals) body.push(section.columns.map((c) => ({ text: section.totals![c.key] == null ? '' : String(section.totals![c.key]), bold: true, alignment: c.align ?? 'left' })) as never);
    content.push({
      table: { headerRows: 1, widths: section.columns.map((c) => c.width ?? 'auto'), body },
      layout: {
        fillColor: (row: number) => (row === 0 ? PRIMARY : row % 2 === 0 ? '#F4F7F8' : null),
        hLineColor: () => '#D5DEE1',
        vLineColor: () => '#D5DEE1',
      },
      fontSize: 8,
    });
    if (section.signatures?.length) {
      content.push({
        columns: section.signatures.map((s) => ({ stack: [{ text: '\n\n\n______________________________', alignment: 'center' }, { text: s, alignment: 'center', style: 'muted' }] })),
        margin: [0, 24, 0, 0],
      });
    }
  });
  if (doc.notes?.length) content.push({ ul: doc.notes, style: 'muted', margin: [0, 12, 0, 0] });

  const definition = {
    pageSize: 'LETTER',
    pageOrientation: doc.landscape ? 'landscape' : 'portrait',
    pageMargins: [36, 86, 36, 48],
    header: {
      margin: [36, 24, 36, 0],
      columns: [
        {
          stack: [
            { text: doc.employer.name, bold: true, fontSize: 11, color: PRIMARY },
            { text: [doc.employer.rfc ? `RFC ${doc.employer.rfc}` : null, doc.employer.registroPatronal ? `Reg. patronal ${doc.employer.registroPatronal}` : null].filter(Boolean).join(' · '), fontSize: 8, color: '#555' },
          ],
        },
        { stack: [{ text: doc.title, bold: true, fontSize: 12, alignment: 'right' }, { text: `Periodo: ${doc.period}`, fontSize: 8, alignment: 'right', color: '#555' }] },
      ],
    },
    footer: (page: number, pages: number) => ({
      margin: [36, 12, 36, 0],
      columns: [
        { text: `Folio ${doc.folio} · Generado ${doc.generatedAt} · Checador`, fontSize: 7, color: '#777' },
        { text: `Página ${page} de ${pages}`, fontSize: 7, alignment: 'right', color: '#777' },
      ],
    }),
    content,
    styles: {
      h2: { fontSize: 11, bold: true, color: PRIMARY },
      th: { bold: true, color: '#FFFFFF' },
      muted: { fontSize: 8, color: '#555' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 9 },
  };

  return new Promise((resolve, reject) => {
    const pdf = printer.createPdfKitDocument(definition);
    const chunks: Buffer[] = [];
    pdf.on('data', (c: Buffer) => chunks.push(c));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
    pdf.end();
  });
}
