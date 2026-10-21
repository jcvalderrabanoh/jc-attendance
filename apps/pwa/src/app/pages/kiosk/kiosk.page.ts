import { Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { KioskApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { safeStorage } from '../../core/auth/storage';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { PUNCH_DONE_LABEL, timeOf } from '../../shared/format';
import { IconComponent } from '../../shared/icon.component';
import { KIOSK_DEVICE_KEY } from './kiosk-activate.page';
import { EMPTY_KEYPAD, KeypadState, canSubmit, pressKey } from './kiosk.logic';

interface Confirmation {
  ok: boolean;
  name: string | null;
  title: string;
  detail: string | null;
}

const CONFIRM_MS = 4000;

/** B1 · Kiosco: QR rotativo para la app + teclado de número de empleado y PIN. */
@Component({
  selector: 'att-kiosk-page',
  imports: [MatButtonModule, IconComponent],
  templateUrl: './kiosk.page.html',
  styleUrl: './kiosk.page.scss',
})
export class KioskPage implements OnInit, OnDestroy {
  private readonly api = inject(KioskApi);
  private readonly zone = inject(NgZone);
  readonly online = inject(ConnectivityService).online;
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('qr');

  readonly deviceName = safeStorage.getJson<{ name: string }>(KIOSK_DEVICE_KEY)?.name ?? 'Kiosco';
  readonly now = signal(new Date());
  readonly qrPayload = signal<string | null>(null);
  readonly qrError = signal<string | null>(null);
  readonly qrTotal = signal(30);
  readonly qrLeft = signal(0);
  readonly qrPercent = computed(() => Math.round((this.qrLeft() / Math.max(1, this.qrTotal())) * 100));
  readonly keypad = signal<KeypadState>(EMPTY_KEYPAD);
  readonly canSubmit = computed(() => canSubmit(this.keypad()));
  readonly busy = signal(false);
  readonly confirmation = signal<Confirmation | null>(null);
  readonly fullscreen = signal(false);
  readonly keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'];

  readonly clock = computed(() => new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(this.now()));
  readonly date = computed(() => {
    const s = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(this.now());
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private qrTimer: ReturnType<typeof setTimeout> | null = null;
  private confirmTimer: ReturnType<typeof setTimeout> | null = null;
  private wakeLock: { release(): Promise<void> } | null = null;
  private qrLib: typeof import('qrcode') | null = null;

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.clockTimer = setInterval(() => {
        this.now.set(new Date());
        this.qrLeft.update((n) => Math.max(0, n - 1));
      }, 1000);
    });
    void this.refreshQr();
    void this.keepAwake();
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.qrTimer) clearTimeout(this.qrTimer);
    if (this.confirmTimer) clearTimeout(this.confirmTimer);
    void this.wakeLock?.release().catch(() => undefined);
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  /** GET /kiosk/qr y se vuelve a pedir al vencer (expiresInSeconds). */
  async refreshQr(): Promise<void> {
    if (this.qrTimer) clearTimeout(this.qrTimer);
    let next = 5;
    try {
      const qr = await firstValueFrom(this.api.qr());
      this.qrPayload.set(qr.payload);
      this.qrTotal.set(30);
      this.qrLeft.set(qr.expiresInSeconds);
      this.qrError.set(null);
      await this.draw(qr.payload);
      next = Math.max(1, qr.expiresInSeconds);
    } catch (err) {
      this.qrPayload.set(null);
      this.qrError.set(apiErrorMessage(err, 'No se pudo generar el código'));
    }
    this.zone.runOutsideAngular(() => {
      this.qrTimer = setTimeout(() => this.zone.run(() => void this.refreshQr()), next * 1000 + 300);
    });
  }

  private async draw(payload: string): Promise<void> {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;
    this.qrLib ??= await import('qrcode');
    await this.qrLib.toCanvas(canvas, payload, { width: 320, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0a3642', light: '#ffffff' } });
  }

  press(key: string): void {
    if (this.busy() || this.confirmation()) return;
    if (key === 'ok' && this.canSubmit()) {
      void this.submit();
      return;
    }
    this.keypad.set(pressKey(this.keypad(), key));
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (/^\d$/.test(e.key)) this.press(e.key);
    else if (e.key === 'Backspace') this.press('back');
    else if (e.key === 'Enter') this.press('ok');
    else if (e.key === 'Escape') this.press('clear');
  }

  async submit(): Promise<void> {
    const k = this.keypad();
    if (!canSubmit(k)) return;
    this.busy.set(true);
    try {
      const res = await firstValueFrom(
        this.api.punch({ employeeNumber: k.employeeNumber, pin: k.pin, idempotencyKey: crypto.randomUUID(), clientAt: new Date().toISOString() }),
      );
      const pending = res.punch.reviewStatus === 'pending';
      this.confirm({
        ok: true,
        name: res.employeeName,
        title: `${PUNCH_DONE_LABEL[res.punch.type]} ${timeOf(res.punch.effectiveAt)}`,
        detail: pending ? 'Pendiente de revisión' : res.locationName,
      });
    } catch (err) {
      this.confirm({ ok: false, name: null, title: 'No se registró', detail: apiErrorMessage(err, 'Intenta de nuevo') });
    } finally {
      this.busy.set(false);
      this.keypad.set(EMPTY_KEYPAD);
    }
  }

  private confirm(c: Confirmation): void {
    this.confirmation.set(c);
    if (this.confirmTimer) clearTimeout(this.confirmTimer);
    this.confirmTimer = setTimeout(() => this.confirmation.set(null), CONFIRM_MS);
  }

  dismiss(): void {
    this.confirmation.set(null);
  }

  async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* iPadOS Safari no permite pantalla completa: usar "Agregar a inicio" */
    }
  }

  private readonly onFullscreenChange = () => this.fullscreen.set(Boolean(document.fullscreenElement));

  private async keepAwake(): Promise<void> {
    try {
      const wl = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock;
      this.wakeLock = (await wl?.request('screen')) ?? null;
    } catch {
      /* sin Wake Lock */
    }
  }
}
