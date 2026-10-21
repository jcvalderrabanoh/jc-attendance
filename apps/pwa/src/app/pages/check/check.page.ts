import { DatePipe } from '@angular/common';
import { Component, DestroyRef, NgZone, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmployeeAuthApi, MeApi } from '../../core/api/api.services';
import { apiErrorMessage, isNetworkError } from '../../core/api/api-error';
import { MyStatus, PunchType } from '../../core/api/models';
import { GEO_CONSENT_KEY, STATUS_CACHE_KEY } from '../../core/auth/session.service';
import { safeStorage } from '../../core/auth/storage';
import { TokenService } from '../../core/auth/token.service';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { PunchQueueService } from '../../core/offline/punch-queue.service';
import { PunchInput, PunchService, QR_REQUIRED_KEY, SELFIE_REQUIRED_KEY } from '../../core/punch/punch.service';
import { PUNCH_DONE_LABEL, PUNCH_TYPE_LABEL, RISK_FLAG_LABEL, formatMinutes, hoursShort, isoDate, timeOf } from '../../shared/format';
import { IconComponent } from '../../shared/icon.component';
import { PunchAction, hhmm, liveMinutes, primaryActionFor, secondaryActionsFor, shiftMinutes, stateAfter, weekBars } from './check.logic';
import { GeoConsentDialog } from './geo-consent.dialog';
import { PunchSheetComponent, PunchSheetData } from './punch-sheet.component';

interface CachedStatus {
  status: MyStatus;
  fetchedAt: number;
}

export interface PunchFeedback {
  tone: 'ok' | 'warn' | 'bad' | 'queued';
  title: string;
  detail?: string;
}

/** A4 · Checar: botón único, reloj, contador en vivo, turno y semana. */
@Component({
  selector: 'att-check-page',
  imports: [DatePipe, MatButtonModule, MatProgressBarModule, RouterLink, IconComponent],
  templateUrl: './check.page.html',
  styleUrl: './check.page.scss',
})
export class CheckPage implements OnInit, OnDestroy {
  private readonly me = inject(MeApi);
  private readonly authApi = inject(EmployeeAuthApi);
  private readonly punches = inject(PunchService);
  private readonly queue = inject(PunchQueueService);
  private readonly tokens = inject(TokenService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly sheet = inject(MatBottomSheet);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  readonly status = signal<MyStatus | null>(null);
  readonly fetchedAt = signal<number>(Date.now());
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly busy = signal(false);
  /** Reloj (cada segundo). */
  readonly now = signal<Date>(new Date());
  /** Contador de horas (cada 30 s). */
  readonly tick = signal<number>(Date.now());
  readonly feedback = signal<PunchFeedback | null>(null);
  readonly online = this.connectivity.online;
  readonly rejected = this.queue.rejected;

  readonly firstName = computed(() => this.tokens.loginInfo()?.firstName ?? '');
  readonly state = computed(() => this.status()?.state ?? 'out');
  readonly primary = computed(() => primaryActionFor(this.state()));
  readonly secondary = computed(() => secondaryActionsFor(this.state()));
  readonly todayMinutes = computed(() => {
    const s = this.status();
    return s ? liveMinutes(s, this.fetchedAt(), this.tick()) : 0;
  });
  readonly target = computed(() => shiftMinutes(this.status()?.shift ?? null) ?? 480);
  readonly todayPercent = computed(() => Math.min(100, Math.round((this.todayMinutes() / this.target()) * 100)));
  readonly today = computed(() => isoDate(this.now(), this.status()?.timeZone));
  readonly bars = computed(() => {
    const s = this.status();
    return s ? weekBars(s.perDay, this.today(), this.todayMinutes(), this.target()) : [];
  });
  readonly weekMinutes = computed(() => this.bars().reduce((a, b) => a + b.minutes, 0));
  readonly workDaysInWeek = computed(() => Math.max(1, this.bars().filter((b) => !b.isFuture || b.minutes > 0).length));
  readonly clock = computed(() =>
    new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: this.status()?.timeZone }).format(this.now()),
  );
  readonly dateLong = computed(() => {
    const s = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: this.status()?.timeZone }).format(this.now());
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  readonly formatMinutes = formatMinutes;
  readonly hoursShort = hoursShort;
  readonly hhmm = hhmm;
  readonly typeLabel = PUNCH_TYPE_LABEL;
  readonly riskLabel = (f: string) => RISK_FLAG_LABEL[f] ?? f;

  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private counterTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const cached = safeStorage.getJson<CachedStatus>(STATUS_CACHE_KEY);
    if (cached?.status) {
      this.status.set(cached.status);
      this.fetchedAt.set(cached.fetchedAt);
    }
    // Fuera de la zona: la app queda "estable" (registro del SW) y los signals refrescan la vista.
    this.zone.runOutsideAngular(() => {
      this.clockTimer = setInterval(() => this.now.set(new Date()), 1000);
      this.counterTimer = setInterval(() => this.tick.set(Date.now()), 30_000);
    });
    this.punches.flushed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => {
      if (s.sent) this.announce({ tone: 'ok', title: s.sent === 1 ? 'Se envió tu marcaje pendiente' : `Se enviaron ${s.sent} marcajes pendientes` });
      void this.load();
    });
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.counterTimer) clearInterval(this.counterTimer);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const status = await firstValueFrom(this.me.status());
      const fetchedAt = Date.now();
      this.status.set(status);
      this.fetchedAt.set(fetchedAt);
      this.tick.set(fetchedAt);
      this.loadError.set(null);
      safeStorage.setJson(STATUS_CACHE_KEY, { status, fetchedAt } satisfies CachedStatus);
    } catch (err) {
      // Offline: se queda con el último estado guardado.
      if (!isNetworkError(err) || !this.status()) this.loadError.set(apiErrorMessage(err, 'No se pudo cargar tu estado'));
    } finally {
      this.loading.set(false);
    }
  }

  /** Flujo completo: consentimiento (una vez) → hoja A5 → registrar. */
  async start(action: PunchAction): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const useGeo = await this.ensureGeoConsent();
      const data: PunchSheetData = {
        action,
        locationName: this.status()?.defaultLocation?.name ?? null,
        useGeo,
        selfieSuggested: safeStorage.get(SELFIE_REQUIRED_KEY) === '1',
        qrSuggested: safeStorage.get(QR_REQUIRED_KEY) === '1',
        online: this.online(),
      };
      const input = await firstValueFrom(this.sheet.open<PunchSheetComponent, PunchSheetData, PunchInput>(PunchSheetComponent, { data, ariaLabel: `Confirmar ${action.verb}` }).afterDismissed());
      if (!input) return;
      await this.register(input);
    } finally {
      this.busy.set(false);
    }
  }

  /** Registra y deja el resultado en la región aria-live. */
  async register(input: PunchInput): Promise<void> {
    const outcome = await this.punches.punch(input);
    if (outcome.kind === 'sent') {
      const p = outcome.result.punch;
      const flags = p.riskFlags.filter((f) => f !== 'offline');
      const pending = p.reviewStatus === 'pending';
      this.announce({
        tone: pending ? 'warn' : 'ok',
        title: `${PUNCH_DONE_LABEL[p.type]} ${timeOf(p.effectiveAt, this.status()?.timeZone)}`,
        detail: [outcome.result.locationName, pending ? 'Pendiente de revisión' : null, ...flags.map(this.riskLabel)].filter(Boolean).join(' · ') || undefined,
      });
      await this.load();
    } else if (outcome.kind === 'queued') {
      this.applyLocally(input.type ?? this.primary().type, new Date(outcome.item.body.clientAt));
      this.announce({ tone: 'queued', title: 'Sin conexión: se enviará al reconectar', detail: `${PUNCH_TYPE_LABEL[input.type ?? 'in']} guardada a las ${timeOf(outcome.item.body.clientAt)}` });
    } else {
      this.announce({ tone: 'bad', title: 'No se registró', detail: outcome.message });
    }
  }

  dismissRejected(key: string): void {
    void this.punches.dismiss(key);
  }

  private announce(f: PunchFeedback): void {
    this.feedback.set(f);
    if (f.tone !== 'queued') {
      this.snack.open(f.detail ? `${f.title} · ${f.detail}` : f.title, 'OK', { duration: 5000, panelClass: f.tone === 'bad' ? 'snack-bad' : f.tone === 'ok' ? 'snack-ok' : undefined, politeness: 'off' });
    }
  }

  /** Marcaje en cola: refleja el cambio de estado para que el botón siga la secuencia. */
  private applyLocally(type: PunchType, at: Date): void {
    const s = this.status();
    if (!s) return;
    const counted = liveMinutes(s, this.fetchedAt(), at.getTime());
    const next: MyStatus = {
      ...s,
      state: stateAfter(type),
      todayMinutes: counted,
      lastPunch: { type, at: at.toISOString(), reviewStatus: 'pending', riskFlags: ['offline'] },
    };
    this.status.set(next);
    this.fetchedAt.set(at.getTime());
    this.tick.set(Date.now());
    safeStorage.setJson(STATUS_CACHE_KEY, { status: next, fetchedAt: at.getTime() } satisfies CachedStatus);
  }

  /**
   * Pide el consentimiento de geolocalización una sola vez
   * (POST /employee-auth/consents ['geolocation']). Devuelve si se puede leer el GPS.
   */
  async ensureGeoConsent(): Promise<boolean> {
    const cached = safeStorage.get(GEO_CONSENT_KEY);
    if (cached === 'granted') return true;
    if (cached === 'declined') return false;
    if (!this.online()) return false;
    try {
      const consents = await firstValueFrom(this.authApi.consents());
      if (consents.some((c) => c.kind === 'geolocation' && !c.revokedAt)) {
        safeStorage.set(GEO_CONSENT_KEY, 'granted');
        return true;
      }
      const accepted = await firstValueFrom(this.dialog.open<GeoConsentDialog, void, boolean>(GeoConsentDialog, { maxWidth: '420px' }).afterClosed());
      if (!accepted) {
        safeStorage.set(GEO_CONSENT_KEY, 'declined');
        return false;
      }
      await firstValueFrom(this.authApi.grant(['geolocation']));
      safeStorage.set(GEO_CONSENT_KEY, 'granted');
      return true;
    } catch {
      return false;
    }
  }
}
