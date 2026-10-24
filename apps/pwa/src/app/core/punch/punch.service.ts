import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';
import { API_URL, MeApi } from '../api/api.services';
import { apiErrorMessage, isNetworkError } from '../api/api-error';
import { PunchType, RegisterPunchBody, RegisterPunchResult } from '../api/models';
import { TokenService } from '../auth/token.service';
import { ConnectivityService } from '../offline/connectivity.service';
import { PunchQueueService, QueuedPunch, SYNC_TAG } from '../offline/punch-queue.service';

export interface PunchInput {
  type?: PunchType;
  lat?: number;
  lng?: number;
  accuracyMeters?: number;
  qrPayload?: string;
  selfieDataUrl?: string;
}

export type PunchOutcome =
  | { kind: 'sent'; result: RegisterPunchResult }
  | { kind: 'queued'; item: QueuedPunch }
  | { kind: 'error'; message: string; status: number };

export interface FlushSummary {
  sent: number;
  rejected: number;
  remaining: number;
}

/** Lo que hay que mostrar si el API pidió algo que no mandamos. */
export const SELFIE_REQUIRED_KEY = 'att.selfieRequired';
export const QR_REQUIRED_KEY = 'att.qrRequired';

/**
 * Registra marcajes. Cada uno lleva `idempotencyKey` (UUID) y `clientAt`.
 * Sin red o si la petición falla por red → IndexedDB y se reenvía después
 * con `offline: true` (al volver la red, al abrir la app, al volver a
 * primer plano y con Background Sync donde existe).
 */
@Injectable({ providedIn: 'root' })
export class PunchService {
  private readonly api = inject(MeApi);
  private readonly queue = inject(PunchQueueService);
  private readonly tokens = inject(TokenService);
  private readonly connectivity = inject(ConnectivityService);
  private flushing: Promise<FlushSummary> | null = null;
  private started = false;

  /** Se emite cuando la cola envió algo (para refrescar el estado de la pantalla). */
  readonly flushed$ = new Subject<FlushSummary>();
  readonly lastFlushError = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);

  /** Engancha los disparadores de reenvío. Idempotente. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    const onOnline = () => void this.flush();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void this.flush();
    };
    const onSwMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === 'att-punch-queue-flushed') {
        void this.queue.refresh().then(() => this.flushed$.next({ sent: (e.data as { sent: number }).sent, rejected: 0, remaining: this.queue.pendingCount() }));
      }
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    navigator.serviceWorker?.addEventListener?.('message', onSwMessage);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener?.('message', onSwMessage);
    });
    void this.queue.refresh().then(() => this.flush());
  }

  newKey(): string {
    return crypto.randomUUID();
  }

  async punch(input: PunchInput, now: Date = new Date()): Promise<PunchOutcome> {
    const body: RegisterPunchBody = { idempotencyKey: this.newKey(), clientAt: now.toISOString(), ...this.clean(input) };
    if (!this.connectivity.online()) return { kind: 'queued', item: await this.enqueue(body) };
    // Lo pendiente va primero para que el servidor reciba la secuencia en orden.
    if (this.queue.pendingCount() > 0) {
      const { remaining } = await this.flush();
      if (remaining > 0) return { kind: 'queued', item: await this.enqueue(body) };
    }
    try {
      const result = await firstValueFrom(this.api.punch(body));
      this.rememberRequirements(result.punch.riskFlags);
      return { kind: 'sent', result };
    } catch (err) {
      if (isNetworkError(err)) {
        this.connectivity.markOffline();
        return { kind: 'queued', item: await this.enqueue(body) };
      }
      const status = err instanceof HttpErrorResponse ? err.status : 0;
      return { kind: 'error', message: apiErrorMessage(err, 'No se pudo registrar el marcaje'), status };
    }
  }

  /** Reenvía la cola en orden. Una sola corrida a la vez. */
  flush(): Promise<FlushSummary> {
    this.flushing ??= this.doFlush().finally(() => (this.flushing = null));
    return this.flushing;
  }

  private async doFlush(): Promise<FlushSummary> {
    const items = (await this.queue.refresh()).filter((i) => !i.rejected);
    const summary: FlushSummary = { sent: 0, rejected: 0, remaining: items.length };
    if (!items.length || !this.tokens.isEmployeeAuthenticated()) return summary;
    for (const item of items) {
      try {
        const result = await firstValueFrom(this.api.punch({ ...item.body, offline: true }));
        this.rememberRequirements(result.punch.riskFlags);
        await this.queue.remove(item.idempotencyKey);
        summary.sent++;
        this.lastFlushError.set(null);
      } catch (err) {
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (isNetworkError(err) || status === 401 || status === 408 || status === 429 || status >= 500) {
          await this.queue.update({ ...item, attempts: item.attempts + 1 });
          this.lastFlushError.set(apiErrorMessage(err));
          break; // sin red o sesión vencida: se reintenta luego
        }
        await this.queue.update({ ...item, attempts: item.attempts + 1, rejected: true, lastError: apiErrorMessage(err) });
        summary.rejected++;
      }
    }
    summary.remaining = this.queue.pendingCount();
    if (summary.sent || summary.rejected) this.flushed$.next(summary);
    return summary;
  }

  /** El empleado descarta un marcaje que el API rechazó. */
  dismiss(idempotencyKey: string): Promise<void> {
    return this.queue.remove(idempotencyKey);
  }

  private async enqueue(body: RegisterPunchBody): Promise<QueuedPunch> {
    const item: QueuedPunch = {
      idempotencyKey: body.idempotencyKey,
      url: new URL(`${API_URL}/me/punches`, globalThis.location?.href ?? 'http://localhost/').toString(),
      token: this.tokens.employeeToken(),
      body: { ...body, offline: true },
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };
    await this.queue.enqueue(item);
    void this.registerBackgroundSync();
    return item;
  }

  private async registerBackgroundSync(): Promise<void> {
    try {
      const reg = (await navigator.serviceWorker?.getRegistration?.()) as (ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }) | undefined;
      await reg?.sync?.register(SYNC_TAG);
    } catch {
      /* sin Background Sync (iOS, Firefox): se vacía al reabrir la app */
    }
  }

  /** El API no expone la política; la inferimos de los flags del marcaje. */
  private rememberRequirements(flags: string[] = []): void {
    try {
      if (flags.includes('no_selfie')) localStorage.setItem(SELFIE_REQUIRED_KEY, '1');
      if (flags.includes('qr_invalid')) localStorage.setItem(QR_REQUIRED_KEY, '1');
    } catch {
      /* nada */
    }
  }

  private clean(input: PunchInput): Partial<RegisterPunchBody> {
    const out: Partial<RegisterPunchBody> = {};
    if (input.type) out.type = input.type;
    if (typeof input.lat === 'number' && typeof input.lng === 'number') {
      out.lat = input.lat;
      out.lng = input.lng;
      if (typeof input.accuracyMeters === 'number') out.accuracyMeters = Math.round(input.accuracyMeters);
    }
    if (input.qrPayload) out.qrPayload = input.qrPayload;
    if (input.selfieDataUrl) out.selfieDataUrl = input.selfieDataUrl;
    return out;
  }
}
