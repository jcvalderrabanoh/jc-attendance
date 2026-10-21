import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { GeoFix, GeolocationService, geoReasonText } from '../../core/device/geolocation.service';
import { PunchInput } from '../../core/punch/punch.service';
import { IconComponent } from '../../shared/icon.component';
import { QrScannerComponent } from '../../shared/qr-scanner.component';
import { SelfieCaptureComponent } from '../../shared/selfie-capture.component';
import { PunchAction } from './check.logic';

export interface PunchSheetData {
  action: PunchAction;
  locationName: string | null;
  /** Hay consentimiento de geolocalización: se lee el GPS una vez. */
  useGeo: boolean;
  selfieSuggested: boolean;
  qrSuggested: boolean;
  online: boolean;
}

/**
 * A5 · Verificación antes de confirmar: precisión del GPS, QR del kiosco
 * opcional y selfie opcional (o sugerida si la política la pide).
 */
@Component({
  selector: 'att-punch-sheet',
  imports: [DecimalPipe, MatButtonModule, IconComponent, QrScannerComponent, SelfieCaptureComponent],
  templateUrl: './punch-sheet.component.html',
  styleUrl: './punch-sheet.component.scss',
})
export class PunchSheetComponent implements OnInit {
  readonly data = inject<PunchSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly ref = inject<MatBottomSheetRef<PunchSheetComponent, PunchInput>>(MatBottomSheetRef);
  private readonly geo = inject(GeolocationService);

  readonly view = signal<'summary' | 'qr' | 'selfie'>('summary');
  readonly locating = signal(false);
  readonly fix = signal<GeoFix | null>(null);
  readonly geoProblem = signal<string | null>(null);
  readonly qrPayload = signal<string | null>(null);
  readonly selfie = signal<string | null>(null);

  ngOnInit(): void {
    if (this.data.useGeo) void this.locate();
  }

  async locate(): Promise<void> {
    this.locating.set(true);
    this.geoProblem.set(null);
    const res = await this.geo.current(10_000);
    this.locating.set(false);
    if (res.ok) this.fix.set(res.fix);
    else this.geoProblem.set(geoReasonText(res.reason));
  }

  accuracyTone(): 'ok' | 'warn' | 'bad' {
    const acc = this.fix()?.accuracyMeters ?? Infinity;
    return acc <= 50 ? 'ok' : acc <= 150 ? 'warn' : 'bad';
  }

  onQr(payload: string): void {
    this.qrPayload.set(payload);
    this.view.set('summary');
  }

  onSelfie(dataUrl: string): void {
    this.selfie.set(dataUrl);
    this.view.set('summary');
  }

  confirm(): void {
    const fix = this.fix();
    this.ref.dismiss({
      type: this.data.action.type,
      ...(fix ? { lat: fix.lat, lng: fix.lng, accuracyMeters: fix.accuracyMeters } : {}),
      ...(this.qrPayload() ? { qrPayload: this.qrPayload()! } : {}),
      ...(this.selfie() ? { selfieDataUrl: this.selfie()! } : {}),
    });
  }

  cancel(): void {
    this.ref.dismiss();
  }
}
