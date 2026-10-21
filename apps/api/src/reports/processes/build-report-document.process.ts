import { Injectable } from '@nestjs/common';
import { addDays, toZonedParts } from '@jc-attendance/rules-engine';
import { sha256 } from '../../common';
import { EmployeeIdentityDao, EmploymentDao, EmploymentRow } from '../../employees/daos';
import { AccountSettingsDao, DepartmentDao } from '../../organization/daos';
import { PunchDao } from '../../punches/daos';
import { IncidentDao, WorkdayDao } from '../../timesheets/daos';
import { Workday } from '../../timesheets/entities';
import { totalsOf } from '../../timesheets/services';
import { ReportParams } from '../dtos';
import { ReportJob, ReportTypeEnum } from '../entities';
import { ReportDocument, ReportSection } from '../renderers';

const STATUS_LABEL: Record<string, string> = {
  ok: 'A tiempo',
  late: 'Retardo',
  absent: 'Falta',
  incomplete: 'Incompleta',
  holiday: 'Festivo',
  rest: 'Descanso',
  leave: 'Permiso',
};
const INCIDENT_LABEL: Record<string, string> = {
  late: 'Retardo',
  absence: 'Falta',
  missing_punch: 'Marcaje faltante',
  early_leave: 'Salida anticipada',
  out_of_geofence: 'Fuera de geocerca',
  daily_limit_exceeded: 'Más de 12 h en el día',
  minor_overtime: 'Menor con tiempo extra',
  weekly_triple_cap_exceeded: 'Triples > 4 h en la semana',
};

const hours = (min: number) => (min / 60).toFixed(2);
const DAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Arma el documento de cada tipo de reporte con los datos del periodo. */
@Injectable()
export class BuildReportDocumentProcess {
  constructor(
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly workdayDao: WorkdayDao,
    private readonly incidentDao: IncidentDao,
    private readonly punchDao: PunchDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly departmentDao: DepartmentDao,
  ) {}

  async process(job: ReportJob): Promise<ReportDocument> {
    const params = job.params as unknown as ReportParams;
    const settings = await this.accountSettingsDao.findByAccount(job.accountId);
    const tz = settings?.timeZone ?? 'America/Mexico_City';
    const employer = {
      name: settings?.employerData?.razonSocial || settings?.displayName || 'Empresa',
      rfc: settings?.employerData?.rfc,
      registroPatronal: settings?.employerData?.registroPatronal,
    };
    const fmt = (d?: Date | null) => {
      if (!d) return '';
      const p = toZonedParts(new Date(d), tz);
      return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
    };
    const now = toZonedParts(new Date(), tz);
    const base = {
      employer,
      period: `${params.from} al ${params.to}`,
      generatedAt: `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(2, '0')} ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')} (${tz})`,
      folio: job.id.slice(0, 8).toUpperCase(),
    };

    const list = await this.employmentDao.list(job.accountId, { departmentId: params.departmentId, locationId: params.locationId, limit: 200 });
    const employments: EmploymentRow[] = params.employmentId ? list.items.filter((e) => e.id === params.employmentId) : list.items;
    const ids = employments.map((e) => e.id);
    const days = await this.workdayDao.findForAccount(job.accountId, params.from, params.to, ids);
    const name = (e: EmploymentRow) => `${e.identity.lastName} ${e.identity.firstName}`;
    const byEmp = (id: string) => days.filter((d) => d.employmentId === id);

    switch (job.type) {
      case ReportTypeEnum.Timesheet:
        return {
          ...base,
          title: 'Hoja de horas',
          sections: employments.map((e) => this.timesheetSection(e, byEmp(e.id), fmt)),
          notes: ['Horas extra clasificadas según LFT (dobles hasta el tope semanal, después triples).', 'Firmar de conformidad.'],
        };

      case ReportTypeEnum.DailyAttendance: {
        const sections: ReportSection[] = [];
        for (let d = params.from; d <= params.to; d = addDays(d, 1)) {
          const rows = employments.map((e) => {
            const w = days.find((x) => x.employmentId === e.id && x.date === d);
            return {
              number: e.employeeNumber ?? '',
              name: name(e),
              in: fmt(w?.firstIn),
              out: fmt(w?.lastOut),
              hours: w ? hours(w.workedMinutes) : '',
              status: w ? STATUS_LABEL[w.status] ?? w.status : 'Sin datos',
            };
          });
          sections.push({
            heading: `${DAY[new Date(`${d}T12:00:00Z`).getUTCDay()]} ${d}`,
            columns: [
              { key: 'number', label: 'No.' },
              { key: 'name', label: 'Empleado', width: '*' },
              { key: 'in', label: 'Entrada', align: 'center' },
              { key: 'out', label: 'Salida', align: 'center' },
              { key: 'hours', label: 'Horas', align: 'right' },
              { key: 'status', label: 'Estado' },
            ],
            rows,
          });
        }
        return { ...base, title: 'Lista de asistencia diaria', sections };
      }

      case ReportTypeEnum.Incidents: {
        const incidents = (await this.incidentDao.list(job.accountId, { from: params.from, to: params.to, limit: 200 })).items.filter((i) => ids.includes(i.employmentId));
        const emp = new Map(employments.map((e) => [e.id, e]));
        return {
          ...base,
          title: 'Incidencias del periodo',
          landscape: true,
          sections: [
            {
              columns: [
                { key: 'date', label: 'Fecha' },
                { key: 'number', label: 'No.' },
                { key: 'name', label: 'Empleado', width: '*' },
                { key: 'type', label: 'Incidencia' },
                { key: 'detail', label: 'Detalle', width: '*' },
                { key: 'status', label: 'Estado' },
              ],
              rows: incidents.map((i) => ({
                date: i.date,
                number: emp.get(i.employmentId)?.employeeNumber ?? '',
                name: emp.get(i.employmentId) ? name(emp.get(i.employmentId)!) : '—',
                type: INCIDENT_LABEL[i.type] ?? i.type,
                detail: i.detail ?? '',
                status: { open: 'Abierta', justified: 'Justificada', dismissed: 'Descartada' }[i.status] ?? i.status,
              })),
            },
          ],
        };
      }

      case ReportTypeEnum.Overtime:
      case ReportTypeEnum.Payroll: {
        const payroll = job.type === ReportTypeEnum.Payroll;
        const rows = employments.map((e) => {
          const t = totalsOf(byEmp(e.id));
          return {
            number: e.employeeNumber ?? '',
            name: name(e),
            rfc: e.identity.rfc ?? '',
            nss: e.identity.nss ?? '',
            workedDays: t.workedDays,
            hours: hours(t.workedMinutes),
            double: hours(t.overtimeDoubleMinutes),
            triple: hours(t.overtimeTripleMinutes),
            night: hours(t.nightMinutes),
            absences: t.absences,
            lates: t.lateDays,
            sundays: t.sundaysWorked,
            holidays: t.holidaysWorked,
          };
        });
        const columns = payroll
          ? [
              { key: 'number', label: 'No. empleado' },
              { key: 'name', label: 'Nombre', width: '*' as const },
              { key: 'rfc', label: 'RFC' },
              { key: 'nss', label: 'NSS' },
              { key: 'workedDays', label: 'Días trab.', align: 'right' as const },
              { key: 'absences', label: 'Faltas', align: 'right' as const },
              { key: 'lates', label: 'Retardos', align: 'right' as const },
              { key: 'double', label: 'HE dobles', align: 'right' as const },
              { key: 'triple', label: 'HE triples', align: 'right' as const },
              { key: 'sundays', label: 'Prima dominical (días)', align: 'right' as const },
              { key: 'holidays', label: 'Festivos trab.', align: 'right' as const },
            ]
          : [
              { key: 'number', label: 'No.' },
              { key: 'name', label: 'Empleado', width: '*' as const },
              { key: 'hours', label: 'Horas trabajadas', align: 'right' as const },
              { key: 'double', label: 'Extra dobles (h)', align: 'right' as const },
              { key: 'triple', label: 'Extra triples (h)', align: 'right' as const },
              { key: 'night', label: 'Nocturnas (h)', align: 'right' as const },
            ];
        return {
          ...base,
          title: payroll ? 'Prenómina (incidencias para nómina)' : 'Horas extra',
          landscape: payroll,
          sections: [{ columns, rows }],
          notes: payroll ? ['Layout genérico; columnas compatibles con la importación de incidencias de CONTPAQi Nóminas y Aspel NOI (ajustar mapeo).'] : undefined,
        };
      }

      case ReportTypeEnum.LegalRecord:
        return this.legalRecord(job, base, employments, days, fmt, tz);
    }
    throw new Error(`Tipo de reporte no soportado: ${job.type}`);
  }

  private timesheetSection(e: EmploymentRow, days: Workday[], fmt: (d?: Date | null) => string): ReportSection {
    const t = totalsOf(days);
    return {
      heading: `${e.identity.lastName} ${e.identity.firstName}`,
      subheading: [e.employeeNumber && `No. ${e.employeeNumber}`, e.identity.curp && `CURP ${e.identity.curp}`, e.identity.nss && `NSS ${e.identity.nss}`].filter(Boolean).join(' · '),
      columns: [
        { key: 'date', label: 'Fecha' },
        { key: 'day', label: 'Día' },
        { key: 'in', label: 'Entrada', align: 'center' },
        { key: 'out', label: 'Salida', align: 'center' },
        { key: 'break', label: 'Desc. (min)', align: 'right' },
        { key: 'hours', label: 'Horas', align: 'right' },
        { key: 'double', label: 'Extra x2', align: 'right' },
        { key: 'triple', label: 'Extra x3', align: 'right' },
        { key: 'late', label: 'Retardo (min)', align: 'right' },
        { key: 'status', label: 'Estado' },
      ],
      rows: days.map((d) => ({
        date: d.date,
        day: DAY[new Date(`${d.date}T12:00:00Z`).getUTCDay()],
        in: fmt(d.firstIn),
        out: fmt(d.lastOut),
        break: d.breakMinutes || '',
        hours: hours(d.workedMinutes),
        double: d.overtimeDoubleMinutes ? hours(d.overtimeDoubleMinutes) : '',
        triple: d.overtimeTripleMinutes ? hours(d.overtimeTripleMinutes) : '',
        late: d.lateMinutes || '',
        status: STATUS_LABEL[d.status] ?? d.status,
      })),
      totals: {
        date: 'Totales',
        hours: hours(t.workedMinutes),
        double: hours(t.overtimeDoubleMinutes),
        triple: hours(t.overtimeTripleMinutes),
        late: t.lateMinutes,
        status: `${t.absences} faltas`,
      },
      signatures: ['Firma del trabajador', 'Recursos Humanos'],
    };
  }

  /**
   * Registro de jornada (LFT art. 132 fr. XXXIV): inicio y fin de cada día con
   * los marcajes originales y un hash por día de la cadena de marcajes, para
   * demostrar que no se alteraron.
   */
  private async legalRecord(job: ReportJob, base: Omit<ReportDocument, 'title' | 'sections'>, employments: EmploymentRow[], days: Workday[], fmt: (d?: Date | null) => string, tz: string): Promise<ReportDocument> {
    const params = job.params as unknown as ReportParams;
    const sections: ReportSection[] = [];
    const from = new Date(`${params.from}T00:00:00Z`);
    const to = new Date(`${addDays(params.to, 2)}T00:00:00Z`);
    const punches = await this.punchDao.findForEmploymentsBetween(job.accountId, employments.map((e) => e.id), new Date(from.getTime() - 86_400_000), to);
    for (const e of employments) {
      const empDays = days.filter((d) => d.employmentId === e.id);
      sections.push({
        heading: `${e.identity.lastName} ${e.identity.firstName}`,
        subheading: [e.employeeNumber && `No. ${e.employeeNumber}`, e.identity.curp && `CURP ${e.identity.curp}`].filter(Boolean).join(' · '),
        columns: [
          { key: 'date', label: 'Fecha' },
          { key: 'start', label: 'Inicio de jornada', align: 'center' },
          { key: 'end', label: 'Fin de jornada', align: 'center' },
          { key: 'hours', label: 'Horas', align: 'right' },
          { key: 'punches', label: 'Marcajes (hora · origen)', width: '*' },
          { key: 'hash', label: 'Huella del día' },
        ],
        rows: empDays.map((d) => {
          const dayPunches = punches.filter(
            (p) => p.employmentId === e.id && new Date(p.effectiveAt) >= new Date((d.firstIn ?? d.scheduledStart ?? new Date(`${d.date}T00:00:00Z`)).getTime() - 6 * 3600_000) && (!d.lastOut || new Date(p.effectiveAt) <= d.lastOut),
          );
          return {
            date: d.date,
            start: fmt(d.firstIn),
            end: fmt(d.lastOut),
            hours: hours(d.workedMinutes),
            punches: dayPunches.map((p) => `${fmt(p.effectiveAt)} ${p.type} · ${p.source}${p.reviewStatus === 'rejected' ? ' (anulado)' : ''}`).join('; '),
            hash: dayPunches.length ? sha256(dayPunches.map((p) => p.hash).join('')).slice(0, 16) : '',
          };
        }),
        totals: { date: 'Total', hours: hours(empDays.reduce((a, d) => a + d.workedMinutes, 0)) },
      });
    }
    return {
      ...base,
      title: 'Registro electrónico de jornada (LFT art. 132 fr. XXXIV)',
      landscape: true,
      sections,
      notes: [
        `Horas en zona ${tz}. Los marcajes son de solo inserción; las correcciones se registran como marcajes nuevos con autor y motivo.`,
        'La huella del día es el SHA-256 de la cadena de hashes de sus marcajes: cualquier alteración posterior la cambia.',
      ],
    };
  }
}
