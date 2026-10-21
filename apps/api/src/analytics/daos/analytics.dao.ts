import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChartDimension, ChartMetric } from '../dtos';

export interface AnalyticsFilters {
  accountId: string;
  from: string;
  to: string;
  locationId?: string;
  departmentId?: string;
}

/** Expresiones SQL de cada métrica sobre `workdays w` (solo días programados para las tasas). */
const METRIC_SQL: Record<ChartMetric, string> = {
  worked_hours: `ROUND(SUM(w."workedMinutes")::numeric / 60, 1)`,
  overtime_hours: `ROUND(SUM(w."overtimeDoubleMinutes" + w."overtimeTripleMinutes")::numeric / 60, 1)`,
  late_count: `COUNT(*) FILTER (WHERE w.status = 'late')`,
  late_minutes: `SUM(w."lateMinutes")`,
  absence_count: `COUNT(*) FILTER (WHERE w.status = 'absent')`,
  attendance_rate: `ROUND(100.0 * COUNT(*) FILTER (WHERE w.status IN ('ok','late','incomplete')) / NULLIF(COUNT(*) FILTER (WHERE w.status IN ('ok','late','incomplete','absent')), 0), 1)`,
  punctuality_rate: `ROUND(100.0 * COUNT(*) FILTER (WHERE w.status = 'ok') / NULLIF(COUNT(*) FILTER (WHERE w.status IN ('ok','late')), 0), 1)`,
  night_hours: `ROUND(SUM(w."nightMinutes")::numeric / 60, 1)`,
};

/**
 * Consultas de analítica. Todas filtran por `accountId` y usan los índices
 * (`workdays(accountId,date)`, GIN de campos personalizados).
 */
@Injectable()
export class AnalyticsDao {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private where(f: AnalyticsFilters, params: unknown[]): string {
    params.push(f.accountId, f.from, f.to);
    let sql = `w."accountId" = $1 AND w.date BETWEEN $2 AND $3 AND e.status != 'deleted'`;
    if (f.locationId) {
      params.push(f.locationId);
      sql += ` AND e."defaultLocationId" = $${params.length}`;
    }
    if (f.departmentId) {
      params.push(f.departmentId);
      sql += ` AND e."departmentId" = $${params.length}`;
    }
    return sql;
  }

  async chart(f: AnalyticsFilters, metric: ChartMetric, dimension: ChartDimension, customFieldKey?: string): Promise<{ label: string; key: string | null; value: number }[]> {
    const params: unknown[] = [];
    const where = this.where(f, params);
    let keyExpr: string;
    let labelExpr: string;
    let joins = '';
    switch (dimension) {
      case 'date':
        keyExpr = labelExpr = `to_char(w.date, 'YYYY-MM-DD')`;
        break;
      case 'week':
        keyExpr = labelExpr = `to_char(date_trunc('week', w.date), 'YYYY-MM-DD')`;
        break;
      case 'weekday':
        keyExpr = `EXTRACT(ISODOW FROM w.date)::text`;
        labelExpr = `(ARRAY['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'])[EXTRACT(ISODOW FROM w.date)::int]`;
        break;
      case 'location':
        joins = `LEFT JOIN "attendance"."locations" l ON l.id = e."defaultLocationId"`;
        keyExpr = `e."defaultLocationId"::text`;
        labelExpr = `COALESCE(l.name, 'Sin sucursal')`;
        break;
      case 'department':
        joins = `LEFT JOIN "attendance"."departments" d ON d.id = e."departmentId"`;
        keyExpr = `e."departmentId"::text`;
        labelExpr = `COALESCE(d.name, 'Sin departamento')`;
        break;
      case 'position':
        joins = `LEFT JOIN "attendance"."positions" p ON p.id = e."positionId"`;
        keyExpr = `e."positionId"::text`;
        labelExpr = `COALESCE(p.name, 'Sin puesto')`;
        break;
      case 'employee':
        joins = `JOIN "attendance"."employee_identities" i ON i.id = e."identityId"`;
        keyExpr = `e.id::text`;
        labelExpr = `i."firstName" || ' ' || i."lastName"`;
        break;
      case 'custom_field':
        if (!customFieldKey) throw new Error('customFieldKey requerido');
        params.push(customFieldKey);
        // Listas múltiples se agrupan por su texto; vacío = «Sin dato».
        keyExpr = labelExpr = `COALESCE(NULLIF(e."customFields" ->> $${params.length}, ''), 'Sin dato')`;
        break;
    }
    const rows = await this.dataSource.query(
      `SELECT ${keyExpr} AS key, ${labelExpr} AS label, ${METRIC_SQL[metric]} AS value
         FROM "attendance"."workdays" w
         JOIN "attendance"."employments" e ON e.id = w."employmentId"
         ${joins}
        WHERE ${where}
        GROUP BY 1, 2
        ORDER BY ${['date', 'week', 'weekday'].includes(dimension) ? '1' : '3 DESC NULLS LAST'}
        LIMIT 200`,
      params,
    );
    return rows.map((r: { key: string | null; label: string; value: string | null }) => ({ key: r.key, label: r.label, value: Number(r.value ?? 0) }));
  }

  /** Serie diaria para el gráfico de asistencia de 30 días. */
  async dailyAttendance(f: AnalyticsFilters) {
    const params: unknown[] = [];
    const where = this.where(f, params);
    return this.dataSource.query(
      `SELECT to_char(w.date, 'YYYY-MM-DD') AS date,
              COUNT(*) FILTER (WHERE w.status IN ('ok','late','incomplete','absent'))::int AS scheduled,
              COUNT(*) FILTER (WHERE w.status IN ('ok','late','incomplete'))::int AS present,
              COUNT(*) FILTER (WHERE w.status = 'late')::int AS late,
              COUNT(*) FILTER (WHERE w.status = 'absent')::int AS absent,
              COUNT(*) FILTER (WHERE w.status = 'leave')::int AS "onLeave"
         FROM "attendance"."workdays" w JOIN "attendance"."employments" e ON e.id = w."employmentId"
        WHERE ${where} GROUP BY 1 ORDER BY 1`,
      params,
    );
  }

  /** Mapa de calor: entradas por hora local y día de la semana. */
  async checkInHeatmap(f: AnalyticsFilters, timeZone: string) {
    const params: unknown[] = [f.accountId, f.from, f.to, timeZone];
    let extra = '';
    if (f.locationId) {
      params.push(f.locationId);
      extra = ` AND p."locationId" = $${params.length}`;
    }
    const rows = await this.dataSource.query(
      `SELECT EXTRACT(ISODOW FROM (p."effectiveAt" AT TIME ZONE $4))::int AS weekday,
              EXTRACT(HOUR FROM (p."effectiveAt" AT TIME ZONE $4))::int AS hour,
              COUNT(*)::int AS count
         FROM "attendance"."punches" p
        WHERE p."accountId" = $1 AND p.type = 'in' AND p."reviewStatus" != 'rejected'
          AND (p."effectiveAt" AT TIME ZONE $4)::date BETWEEN $2 AND $3 ${extra}
        GROUP BY 1, 2`,
      params,
    );
    return rows as { weekday: number; hour: number; count: number }[];
  }

  /** Planificadas vs. trabajadas (horas) por día. */
  async plannedVsWorked(f: AnalyticsFilters) {
    const params: unknown[] = [];
    const where = this.where(f, params);
    return this.dataSource.query(
      `SELECT to_char(w.date, 'YYYY-MM-DD') AS date,
              ROUND(SUM(EXTRACT(EPOCH FROM (w."scheduledEnd" - w."scheduledStart")) / 3600)::numeric, 1)::float AS planned,
              ROUND(SUM(w."workedMinutes")::numeric / 60, 1)::float AS worked
         FROM "attendance"."workdays" w JOIN "attendance"."employments" e ON e.id = w."employmentId"
        WHERE ${where} GROUP BY 1 ORDER BY 1`,
      params,
    );
  }

  /** Quién está dentro ahora: último marcaje válido de cada empleado activo. */
  async presenceNow(accountId: string) {
    return this.dataSource.query(
      `SELECT DISTINCT ON (p."employmentId") p."employmentId", p.type, p."effectiveAt", p."locationId",
              i."firstName", i."lastName", e."departmentId", e."employeeNumber"
         FROM "attendance"."punches" p
         JOIN "attendance"."employments" e ON e.id = p."employmentId" AND e.status = 'active'
         JOIN "attendance"."employee_identities" i ON i.id = e."identityId"
        WHERE p."accountId" = $1 AND p."reviewStatus" != 'rejected' AND p."effectiveAt" > now() - interval '36 hours'
        ORDER BY p."employmentId", p."effectiveAt" DESC`,
      [accountId],
    );
  }

  async counts(accountId: string) {
    const [row] = await this.dataSource.query(
      `SELECT
         (SELECT COUNT(*) FROM "attendance"."employments" WHERE "accountId" = $1 AND status = 'active' AND "onboardingStatus" = 'approved')::int AS "activeEmployees",
         (SELECT COUNT(*) FROM "attendance"."punches" WHERE "accountId" = $1 AND "reviewStatus" = 'pending')::int AS "punchesToReview",
         (SELECT COUNT(*) FROM "attendance"."onboarding_requests" WHERE "accountId" = $1 AND "reviewStatus" = 'pending')::int AS "pendingOnboarding",
         (SELECT COUNT(*) FROM "attendance"."requests" WHERE "accountId" = $1 AND "requestStatus" = 'pending')::int AS "pendingRequests",
         (SELECT COUNT(*) FROM "attendance"."incidents" WHERE "accountId" = $1 AND status = 'open' AND date > now() - interval '30 days')::int AS "openIncidents"`,
      [accountId],
    );
    return row as Record<string, number>;
  }
}
