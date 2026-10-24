import { ReportDocument } from './report-document';

const cell = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV con BOM (Excel en español abre bien acentos). Una sección = un bloque con su encabezado. */
export function renderCsv(doc: ReportDocument): Buffer {
  const lines: string[] = [];
  for (const section of doc.sections) {
    if (doc.sections.length > 1 && section.heading) lines.push(cell(section.heading));
    lines.push(section.columns.map((c) => cell(c.label)).join(','));
    for (const row of section.rows) lines.push(section.columns.map((c) => cell(row[c.key])).join(','));
    if (section.totals) lines.push(section.columns.map((c) => cell(section.totals![c.key])).join(','));
    if (doc.sections.length > 1) lines.push('');
  }
  return Buffer.from('﻿' + lines.join('\r\n'), 'utf8');
}
