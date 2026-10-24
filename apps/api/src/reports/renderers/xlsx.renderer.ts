import * as ExcelJS from 'exceljs';
import { ReportDocument } from './report-document';

/** Excel: una hoja por sección (máx. 31 caracteres por nombre de hoja). */
export async function renderXlsx(doc: ReportDocument): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Checador';
  wb.created = new Date();
  const used = new Set<string>();
  doc.sections.forEach((section, i) => {
    let name = (section.heading ?? doc.title).replace(/[\\/*?:[\]]/g, ' ').slice(0, 28) || `Hoja ${i + 1}`;
    while (used.has(name)) name = `${name.slice(0, 25)} ${i + 1}`;
    used.add(name);
    const ws = wb.addWorksheet(name);
    ws.addRow([doc.title]).font = { bold: true, size: 14 };
    ws.addRow([`${doc.employer.name}${doc.employer.rfc ? ` · RFC ${doc.employer.rfc}` : ''}`]);
    ws.addRow([`Periodo: ${doc.period}${section.subheading ? ` · ${section.subheading}` : ''}`]);
    ws.addRow([]);
    const header = ws.addRow(section.columns.map((c) => c.label));
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C5C' } };
    for (const row of section.rows) ws.addRow(section.columns.map((c) => row[c.key] ?? ''));
    if (section.totals) ws.addRow(section.columns.map((c) => section.totals![c.key] ?? '')).font = { bold: true };
    section.columns.forEach((c, idx) => {
      ws.getColumn(idx + 1).width = Math.max(10, Math.min(40, c.label.length + 4));
    });
    ws.addRow([]);
    ws.addRow([`Folio ${doc.folio} · generado ${doc.generatedAt}`]).font = { italic: true, size: 9 };
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}
