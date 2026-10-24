import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { MeApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { MyTimesheet, Punch, Workday } from '../../core/api/models';
import { PUNCH_TYPE_LABEL, WORKDAY_STATUS, addDaysIso, dayLabel, formatMinutes, hoursShort, isoDate, rangeLabel, timeOf, weekStartIso } from '../../shared/format';
import { IconComponent } from '../../shared/icon.component';

/** Jornada semanal de referencia (LFT: 48 h). */
const WEEK_TARGET_MINUTES = 48 * 60;

interface DayRow {
  date: string;
  label: string;
  workday: Workday | null;
  punches: Punch[];
  future: boolean;
}

/** A6 · Mis registros: semana, total vs. objetivo y detalle por día. */
@Component({
  selector: 'att-history-page',
  imports: [MatButtonModule, MatProgressBarModule, IconComponent],
  templateUrl: './history.page.html',
  styleUrl: './history.page.scss',
})
export class HistoryPage implements OnInit {
  private readonly me = inject(MeApi);

  readonly today = isoDate(new Date());
  readonly weekStart = signal(weekStartIso(this.today));
  readonly weekEnd = computed(() => addDaysIso(this.weekStart(), 6));
  readonly label = computed(() => rangeLabel(this.weekStart(), this.weekEnd()));
  readonly isCurrentWeek = computed(() => this.weekStart() === weekStartIso(this.today));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly timesheet = signal<MyTimesheet | null>(null);
  readonly punches = signal<Punch[]>([]);

  readonly worked = computed(() => this.timesheet()?.totals.workedMinutes ?? 0);
  readonly percent = computed(() => Math.min(100, Math.round((this.worked() / WEEK_TARGET_MINUTES) * 100)));
  readonly target = WEEK_TARGET_MINUTES;

  readonly days = computed<DayRow[]>(() => {
    const byDate = new Map((this.timesheet()?.days ?? []).map((d) => [d.date, d]));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDaysIso(this.weekStart(), i);
      return {
        date,
        label: dayLabel(date, 'long'),
        workday: byDate.get(date) ?? null,
        punches: this.punches().filter((p) => isoDate(new Date(p.effectiveAt)) === date),
        future: date > this.today,
      };
    });
  });

  readonly status = WORKDAY_STATUS;
  readonly typeLabel = PUNCH_TYPE_LABEL;
  readonly formatMinutes = formatMinutes;
  readonly hoursShort = hoursShort;
  readonly timeOf = timeOf;

  ngOnInit(): void {
    void this.load();
  }

  move(weeks: number): void {
    this.weekStart.set(addDaysIso(this.weekStart(), weeks * 7));
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const from = this.weekStart();
    const to = this.weekEnd();
    try {
      const fromIso = new Date(`${from}T00:00:00`).toISOString();
      const toIso = new Date(`${addDaysIso(to, 1)}T00:00:00`).toISOString();
      const [ts, punches] = await Promise.all([firstValueFrom(this.me.timesheet(from, to)), firstValueFrom(this.me.punches(fromIso, toIso))]);
      if (from !== this.weekStart()) return; // cambió de semana mientras cargaba
      this.timesheet.set(ts);
      this.punches.set([...punches].sort((a, b) => a.effectiveAt.localeCompare(b.effectiveAt)));
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'No se pudo cargar tu historial'));
    } finally {
      this.loading.set(false);
    }
  }
}
