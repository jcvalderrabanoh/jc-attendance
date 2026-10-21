import { Component, ElementRef, OnDestroy, OnInit, output, signal, viewChild } from '@angular/core';
import { createQrReader, isKioskQr, openCamera, stopStream } from '../core/device/camera';
import { IconComponent } from './icon.component';

/** Lee el QR rotativo del kiosco con la cámara trasera. */
@Component({
  selector: 'att-qr-scanner',
  imports: [IconComponent],
  template: `
    <div class="frame">
      <video #video playsinline muted autoplay aria-label="Vista de la cámara para leer el QR"></video>
      <div class="target" aria-hidden="true"></div>
    </div>
    <p class="status" role="status">
      @if (error(); as e) { <att-icon name="error" [size]="18" /> {{ e }} }
      @else if (wrong()) { <att-icon name="qr_code_2" [size]="18" /> Ese QR no es del kiosco del Checador }
      @else { <att-icon name="qr_code_scanner" [size]="18" /> Apunta al código del kiosco }
    </p>
  `,
  styles: `
    .frame { position: relative; border-radius: 16px; overflow: hidden; background: #0a1f25; aspect-ratio: 1; max-height: 50vh; margin: 0 auto; }
    video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .target { position: absolute; inset: 18%; border: 3px solid var(--att-accent); border-radius: 16px; box-shadow: 0 0 0 999px rgb(0 0 0 / 35%); }
    .status { display: flex; gap: 6px; align-items: center; justify-content: center; font-size: 0.9rem; color: var(--att-muted); margin: 8px 0 0; }
  `,
})
export class QrScannerComponent implements OnInit, OnDestroy {
  readonly scanned = output<string>();
  readonly error = signal<string | null>(null);
  readonly wrong = signal(false);
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  async ngOnInit(): Promise<void> {
    try {
      this.stream = await openCamera('environment');
      if (this.stopped) return stopStream(this.stream);
      const video = this.video().nativeElement;
      video.srcObject = this.stream;
      await video.play().catch(() => undefined);
      const read = await createQrReader();
      const loop = async () => {
        if (this.stopped) return;
        try {
          const value = await read(video);
          if (isKioskQr(value)) {
            this.scanned.emit(value);
            this.stop();
            return;
          }
          this.wrong.set(Boolean(value));
        } catch {
          /* cuadro ilegible: seguimos */
        }
        this.timer = setTimeout(loop, 250);
      };
      void loop();
    } catch (err) {
      this.error.set(err instanceof Error && err.name === 'NotAllowedError' ? 'Permite el uso de la cámara para leer el QR' : 'No se pudo abrir la cámara');
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    stopStream(this.stream);
    this.stream = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
