import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { KioskApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { safeStorage } from '../../core/auth/storage';
import { TokenService } from '../../core/auth/token.service';
import { IconComponent } from '../../shared/icon.component';

export const KIOSK_DEVICE_KEY = 'att.kioskDevice';

/** B2 · Vincular la tablet con el código de 8 caracteres de la consola. */
@Component({
  selector: 'att-kiosk-activate-page',
  imports: [FormsModule, MatButtonModule, IconComponent],
  template: `
    <main class="wrap">
      <form class="card panel" (ngSubmit)="activate()" novalidate>
        <img src="icons/icon-192.png" alt="" width="64" height="64" />
        <h1>Activar kiosco</h1>
        <p class="muted">Escribe el código de 8 caracteres que generaste en la consola (Sucursales › Kioscos).</p>
        <label for="code" class="sr-only">Código de activación</label>
        <input id="code" name="code" class="code" [(ngModel)]="code" maxlength="8" autocomplete="off" autocapitalize="characters"
               spellcheck="false" placeholder="ABCD1234" (input)="normalize()" aria-describedby="code-help" />
        <p id="code-help" class="muted small">{{ code.length }}/8 caracteres</p>
        @if (error(); as e) { <p class="form-error" role="alert"><att-icon name="error" [size]="20" /> {{ e }}</p> }
        <button mat-flat-button type="submit" class="btn-block" [disabled]="code.length !== 8 || busy()">
          <att-icon name="tablet" [size]="20" /> {{ busy() ? 'Activando…' : 'Activar este dispositivo' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    .wrap { min-height: 100dvh; display: grid; place-items: center; padding: 16px; background: linear-gradient(160deg, #e3eff2, #f5f8f9); }
    .panel { width: min(100%, 460px); text-align: center; padding: 32px 24px; }
    img { border-radius: 16px; }
    h1 { color: var(--att-primary-dark); margin: 12px 0 4px; }
    .code { width: 100%; height: 72px; text-align: center; font: 700 2rem Inter, monospace; letter-spacing: 8px; text-transform: uppercase;
      border: 2px solid #b8c7cc; border-radius: 14px; margin-top: 12px; }
    .code:focus { outline: none; border-color: var(--att-primary); box-shadow: 0 0 0 4px rgb(15 76 92 / 18%); }
    .small { font-size: 0.8rem; }
  `,
})
export class KioskActivatePage {
  private readonly api = inject(KioskApi);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  code = '';
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  normalize(): void {
    this.code = this.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  }

  async activate(): Promise<void> {
    if (this.code.length !== 8) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.activate(this.code));
      this.tokens.setKioskToken(res.token);
      safeStorage.setJson(KIOSK_DEVICE_KEY, { id: res.device.id, name: res.device.name });
      await this.router.navigateByUrl('/kiosco');
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Código inválido o vencido'));
    } finally {
      this.busy.set(false);
    }
  }
}
