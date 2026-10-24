import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CustomFieldDefinition } from '../../custom-fields/entities';
import { DepartmentDao, PositionDao } from '../../organization/daos';
import { LocationDao } from '../../locations/daos';
import { CreateEmployeeDto } from '../dtos';

/** Columnas base de la plantilla (encabezado → campo). */
export const IMPORT_COLUMNS: { header: string; field: string; required?: boolean }[] = [
  { header: 'Nombre', field: 'firstName', required: true },
  { header: 'Apellidos', field: 'lastName', required: true },
  { header: 'Teléfono', field: 'phone' },
  { header: 'Email', field: 'email' },
  { header: 'CURP', field: 'curp' },
  { header: 'RFC', field: 'rfc' },
  { header: 'NSS', field: 'nss' },
  { header: 'Número de empleado', field: 'employeeNumber' },
  { header: 'Departamento', field: 'department' },
  { header: 'Puesto', field: 'position' },
  { header: 'Sucursal', field: 'location' },
  { header: 'Fecha de ingreso (AAAA-MM-DD)', field: 'hireDate' },
];

const normalizeHeader = (h: string) =>
  h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*\)/, '')
    .trim();

export interface ParsedImportRow {
  row: number;
  dto: CreateEmployeeDto | null;
  errors: string[];
}

/** Lee XLSX/CSV y lo traduce a `CreateEmployeeDto` (sin validar reglas de negocio). */
@Injectable()
export class ImportEmployeesProcess {
  constructor(
    private readonly departmentDao: DepartmentDao,
    private readonly positionDao: PositionDao,
    private readonly locationDao: LocationDao,
  ) {}

  async template(fields: CustomFieldDefinition[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Empleados');
    const header = ws.addRow([...IMPORT_COLUMNS.map((c) => c.header), ...fields.map((f) => f.label)]);
    header.font = { bold: true };
    ws.addRow(['Ana', 'López Ruiz', '5512345678', 'ana@empresa.com', '', '', '', 'E-010', 'Producción', 'Panadero', 'Sucursal Centro', '2026-01-15']);
    ws.columns.forEach((c) => (c.width = 22));
    if (fields.some((f) => f.options.length)) {
      const notes = wb.addWorksheet('Opciones');
      fields.filter((f) => f.options.length).forEach((f) => notes.addRow([f.label, ...f.options]));
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async parse(accountId: string, buffer: Buffer, fileName: string, fields: CustomFieldDefinition[]): Promise<ParsedImportRow[]> {
    const matrix = /\.csv$/i.test(fileName) ? this.parseCsv(buffer.toString('utf8').replace(/^﻿/, '')) : await this.parseXlsx(buffer);
    if (matrix.length < 2) return [];
    const headers = matrix[0].map((h) => normalizeHeader(String(h ?? '')));
    const colOf = (header: string) => headers.indexOf(normalizeHeader(header));
    const [departments, positions, locations] = await Promise.all([
      this.departmentDao.findAll(accountId),
      this.positionDao.findAll(accountId),
      this.locationDao.findAll(accountId),
    ]);
    const byName = <T extends { id: string; name: string }>(list: T[], name: string) => list.find((x) => x.name.toLowerCase() === name.toLowerCase());

    return matrix.slice(1).flatMap((cells, i) => {
      const get = (header: string) => {
        const idx = colOf(header);
        const v = idx >= 0 ? cells[idx] : undefined;
        return v == null ? '' : String(v instanceof Date ? v.toISOString().slice(0, 10) : v).trim();
      };
      if (cells.every((c) => c == null || String(c).trim() === '')) return [];
      const errors: string[] = [];
      const value = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c.field, get(c.header)]));
      for (const c of IMPORT_COLUMNS.filter((x) => x.required)) if (!value[c.field]) errors.push(`Falta ${c.header}`);
      const lookup = (raw: string, list: { id: string; name: string }[], label: string) => {
        if (!raw) return undefined;
        const found = byName(list, raw);
        if (!found) errors.push(`${label} «${raw}» no existe`);
        return found?.id;
      };
      const customFields: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = get(f.label) || get(f.key);
        if (raw) customFields[f.key] = raw;
      }
      const dto: CreateEmployeeDto = {
        identity: {
          firstName: value.firstName,
          lastName: value.lastName,
          phone: value.phone || undefined,
          email: value.email || undefined,
          curp: value.curp || undefined,
          rfc: value.rfc || undefined,
          nss: value.nss || undefined,
        },
        employeeNumber: value.employeeNumber || undefined,
        departmentId: lookup(value.department, departments, 'Departamento'),
        positionId: lookup(value.position, positions, 'Puesto'),
        defaultLocationId: lookup(value.location, locations, 'Sucursal'),
        hireDate: value.hireDate || undefined,
        customFields,
      };
      if (value.hireDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.hireDate)) errors.push('Fecha de ingreso en formato AAAA-MM-DD');
      return [{ row: i + 2, dto: errors.length ? null : dto, errors }];
    });
  }

  private async parseXlsx(buffer: Buffer): Promise<unknown[][]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    const rows: unknown[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const values = (row.values as unknown[]).slice(1).map((v) => (v && typeof v === 'object' && 'text' in (v as object) ? (v as { text: string }).text : v));
      rows.push(values);
    });
    return rows;
  }

  /** CSV simple con comillas; separador `,` o `;`. */
  private parseCsv(text: string): string[][] {
    const sep = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === sep) {
        row.push(cell);
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else cell += ch;
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows;
  }
}
