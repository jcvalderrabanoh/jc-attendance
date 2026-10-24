/** Documento neutro que cada renderer (PDF, Excel, CSV) pinta a su manera. */
export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: number | '*';
}

export interface ReportSection {
  heading?: string;
  subheading?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  totals?: Record<string, string | number | null>;
  /** Líneas de firma (empleado y RH) al pie de la sección. */
  signatures?: string[];
}

export interface ReportDocument {
  title: string;
  employer: { name: string; rfc?: string; registroPatronal?: string };
  period: string;
  generatedAt: string;
  folio: string;
  sections: ReportSection[];
  notes?: string[];
  landscape?: boolean;
}
