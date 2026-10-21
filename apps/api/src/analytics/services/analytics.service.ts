import { BadRequestException, Injectable } from '@nestjs/common';
import { addDays, dayOfWeek, localDateOf } from '@jc-attendance/rules-engine';
import { CoreLinkService } from '../../core-link';
import { CustomFieldDefinitionDao } from '../../custom-fields/daos';
import { CustomFieldEntityEnum } from '../../custom-fields/entities';
import { AccountSettingsDao } from '../../organization/daos';
import { AnalyticsDao, AnalyticsFilters } from '../daos';
import { AnalyticsRangeDto, ChartQueryDto } from '../dtos';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dao: AnalyticsDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly customFieldDao: CustomFieldDefinitionDao,
    private readonly coreLink: CoreLinkService,
  ) {}

  /**
   * Grupo empresarial: KPIs de cada cuenta donde el usuario (mismo email en
   * jc-core) tiene acceso y el Checador contratado. Solo lectura agregada.
   */
  async group(email: string) {
    const accounts = await this.coreLink.attendanceAccountsForEmail(email);
    const rows = await Promise.all(
      accounts.map(async (a) => {
        const d = await this.dashboard(a.id);
        return { accountId: a.id, accountName: a.name, ...d.kpis };
      }),
    );
    const sum = (k: keyof (typeof rows)[number]) => rows.reduce((acc, r) => acc + (Number(r[k]) || 0), 0);
    return {
      accounts: rows,
      totals: {
        accounts: rows.length,
        activeEmployees: sum('activeEmployees'),
        presentNow: sum('presentNow'),
        overtimeHoursWeek: Math.round(sum('overtimeHoursWeek') * 10) / 10,
        punchesToReview: sum('punchesToReview'),
        pendingOnboarding: sum('pendingOnboarding'),
      },
    };
  }

  private async today(accountId: string) {
    const settings = await this.accountSettingsDao.findByAccount(accountId);
    const tz = settings?.timeZone ?? 'America/Mexico_City';
    return { tz, today: localDateOf(new Date(), tz), weekStartsOn: settings?.weekStartsOn ?? 1 };
  }

  /** Tablero (C1): KPIs de hoy y gráficos base. */
  async dashboard(accountId: string, locationId?: string) {
    const { tz, today, weekStartsOn } = await this.today(accountId);
    const monthStart = `${today.slice(0, 8)}01`;
    const weekStart = addDays(today, -((dayOfWeek(today) - weekStartsOn + 7) % 7));
    const base: AnalyticsFilters = { accountId, from: today, to: today, locationId };

    const [presence, counts, todayRate, monthRate, weekOvertime, daily, heatmap, overtimeByLocation, topLate, plannedVsWorked] = await Promise.all([
      this.dao.presenceNow(accountId),
      this.dao.counts(accountId),
      this.dao.chart(base, 'punctuality_rate', 'date'),
      this.dao.chart({ ...base, from: monthStart }, 'attendance_rate', 'week'),
      this.dao.chart({ ...base, from: weekStart }, 'overtime_hours', 'week'),
      this.dao.dailyAttendance({ ...base, from: addDays(today, -29) }),
      this.dao.checkInHeatmap({ ...base, from: addDays(today, -29) }, tz),
      this.dao.chart({ ...base, from: weekStart }, 'overtime_hours', 'location'),
      this.dao.chart({ ...base, from: monthStart }, 'late_count', 'employee'),
      this.dao.plannedVsWorked({ ...base, from: addDays(today, -13) }),
    ]);
    const presentNow = presence.filter((p: { type: string; locationId: string }) => (p.type === 'in' || p.type === 'break_end') && (!locationId || p.locationId === locationId)).length;
    const scheduledMonth = (daily as { scheduled: number }[]).reduce((a, d) => a + d.scheduled, 0);
    const absentMonth = (daily as { absent: number; date: string }[]).filter((d) => d.date >= monthStart).reduce((a, d) => a + d.absent, 0);
    return {
      date: today,
      timeZone: tz,
      kpis: {
        presentNow,
        activeEmployees: counts.activeEmployees,
        punctualityToday: todayRate[0]?.value ?? null,
        attendanceRateMonth: monthRate.length ? Math.round(monthRate.reduce((a, r) => a + r.value, 0) / monthRate.length) : null,
        absenteeismRateMonth: scheduledMonth ? Math.round((1000 * absentMonth) / scheduledMonth) / 10 : null,
        overtimeHoursWeek: weekOvertime.reduce((a, r) => a + r.value, 0),
        punchesToReview: counts.punchesToReview,
        pendingOnboarding: counts.pendingOnboarding,
        pendingRequests: counts.pendingRequests,
        openIncidents: counts.openIncidents,
      },
      charts: {
        dailyAttendance: daily,
        checkInHeatmap: heatmap,
        overtimeByLocation,
        topLate: topLate.filter((r) => r.value > 0).slice(0, 10),
        plannedVsWorked,
      },
    };
  }

  /** Constructor de gráficos (C13): métrica × dimensión, incluidos campos personalizados. */
  async chart(accountId: string, q: ChartQueryDto) {
    if (q.from > q.to) throw new BadRequestException('El rango de fechas está invertido');
    if (q.dimension === 'custom_field') {
      if (!q.customFieldKey) throw new BadRequestException('Elige el campo personalizado');
      const def = await this.customFieldDao.findByKey(accountId, CustomFieldEntityEnum.Employment, q.customFieldKey);
      if (!def?.chartable) throw new BadRequestException('Ese campo no está marcado como graficable');
    }
    const series = await this.dao.chart({ accountId, from: q.from, to: q.to, locationId: q.locationId, departmentId: q.departmentId }, q.metric, q.dimension, q.customFieldKey);
    return { metric: q.metric, dimension: q.dimension, customFieldKey: q.customFieldKey ?? null, series };
  }

  /** Dimensiones disponibles para el constructor (incluye campos graficables). */
  async chartOptions(accountId: string) {
    const fields = (await this.customFieldDao.findForEntity(accountId, CustomFieldEntityEnum.Employment)).filter((f) => f.chartable);
    return {
      metrics: [
        { key: 'worked_hours', label: 'Horas trabajadas' },
        { key: 'overtime_hours', label: 'Horas extra' },
        { key: 'late_count', label: 'Retardos' },
        { key: 'late_minutes', label: 'Minutos de retardo' },
        { key: 'absence_count', label: 'Faltas' },
        { key: 'attendance_rate', label: '% asistencia' },
        { key: 'punctuality_rate', label: '% puntualidad' },
        { key: 'night_hours', label: 'Horas nocturnas' },
      ],
      dimensions: [
        { key: 'date', label: 'Día' },
        { key: 'week', label: 'Semana' },
        { key: 'weekday', label: 'Día de la semana' },
        { key: 'location', label: 'Sucursal' },
        { key: 'department', label: 'Departamento' },
        { key: 'position', label: 'Puesto' },
        { key: 'employee', label: 'Empleado' },
        ...fields.map((f) => ({ key: 'custom_field', customFieldKey: f.key, label: f.label })),
      ],
    };
  }

  presence(accountId: string) {
    return this.dao.presenceNow(accountId);
  }

  range(accountId: string, q: AnalyticsRangeDto) {
    return this.dao.dailyAttendance({ accountId, ...q });
  }
}
