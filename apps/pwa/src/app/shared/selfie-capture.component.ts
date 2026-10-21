import { Component, ElementRef, OnDestroy, OnInit, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { captureJpeg, openCamera, stopStream } from '../core/device/camera';
import { IconComponent } from './icon.component';

/** Selfie con la cámara frontal → JPEG ≤ 400 KB. */
@Component({
  selector: 'att-selfie-capture',
  imports: [MatButtonModule, IconComponent],
  template: `
    <div class="frame">
      <video #video playsinline muted autoplay aria-label="Vista de la cámara frontal"></video>
      <div class="oval" aria-hidden="true"></div>
    </div>
    @if (error(); as e) {
      <p class="form-error" role="alert"><att-icon name="error" [size]="20" /> {{ e }}</p>
    } @else {
      <p class="hint">Centra tu cara en el óvalo</p>
    }
    <button mat-flat-button type="button" class="btn-block" (click)="take()" [disabled]="!ready()">
      <att-icon name="photo_camera" [size]="20" /> Tomar foto
    </button>
  `,
  styles: `
    .frame { position: relative; border-radius: 16px; overflow: hidden; background: #0a1f25; aspect-ratio: 3/4; max-height: 45vh; margin: 0 auto; }
    video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); display: block; }
    .oval { position: absolute; left: 18%; right: 18%; top: 12%; bottom: 16%; border: 3px dashed rgb(255 255 255 / 85%); border-radius: 50%; }
    .hint { text-align: center; color: var(--att-muted); margin: 8px 0; font-size: 0.9rem; }
  `,
})
export class SelfieCaptureComponent implements OnInit, OnDestroy {
  readonly captured = output<string>();
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.stream = await openCamera('user');
      const video = this.video().nativeElement;
      video.srcObject = this.stream;
      await video.play().catch(() => undefined);
      this.ready.set(true);
    } catch (err) {
      this.error.set(err instanceof Error && err.name === 'NotAllowedError' ? 'Permite el uso de la cámara para la selfie' : 'No se pudo abrir la cámara');
    }
  }

  take(): void {
    try {
      this.captured.emit(captureJpeg(this.video().nativeElement));
      this.ngOnDestroy();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo tomar la foto');
    }
  }

  ngOnDestroy(): void {
    stopStream(this.stream);
    this.stream = null;
  }
}
