import { Component, OnDestroy, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmployeeAuthApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { OtpChannel } from '../../core/api/models';
import { TokenService } from '../../core/auth/token.service';
import { BrandHeaderComponent } from '../../shared/brand-header.component';
import { IconComponent } from '../../shared/icon.component';
import { OtpInputComponent } from '../../shared/otp-input.component';
import { isMxMobile, maskDestination, toE164Mx } from '../../shared/phone';

const RESEND_SECONDS = 60;

/** A2 · Acceso sin contraseña: teléfono (+52) o email → código de 6 dígitos. */
@Component({
  selector: 'att-login-page',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, BrandHeaderComponent, IconComponent, OtpInputComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnDestroy {
  private readonly api = inject(EmployeeAuthApi);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  /** ?expirada=1 cuando el interceptor cerró la sesión. */
  readonly expirada = input<string | undefined>();

  readonly mode = signal<'phone' | 'email'>('phone');
  readonly step = signal<'destination' | 'code'>('destination');
  phone = '';
  email = '';
  readonly code = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly sentTo = signal('');
  readonly sentChannel = signal<OtpChannel>('whatsapp');
  readonly resendIn = signal(0);
  private destination = '';
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly maskDestination = maskDestination;

  toggleMode(): void {
    this.mode.set(this.mode() === 'phone' ? 'email' : 'phone');
    this.error.set(null);
  }

  canSend(): boolean {
    return this.mode() === 'phone' ? isMxMobile(this.phone) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  async send(channel?: OtpChannel): Promise<void> {
    if (!this.canSend()) {
      this.error.set(this.mode() === 'phone' ? 'Escribe tu celular a 10 dígitos' : 'Escribe un email válido');
      return;
    }
    this.destination = this.mode() === 'phone' ? toE164Mx(this.phone) : this.email.trim().toLowerCase();
    const ch: OtpChannel | undefined = this.mode() === 'email' ? 'email' : channel;
    this.busy.set(true);
    this.error.set(null);
    try {
      const sent = await firstValueFrom(this.api.requestOtp(this.destination, ch));
      this.sentTo.set(sent.destination);
      this.sentChannel.set(sent.channel);
      this.code.set('');
      this.step.set('code');
      this.startResendTimer();
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'No pudimos enviarte el código'));
    } finally {
      this.busy.set(false);
    }
  }

  async verify(code = this.code()): Promise<void> {
    if (!/^\d{6}$/.test(code) || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.verify(this.destination, code));
      this.tokens.setEmployeeToken(res.token);
      this.tokens.setLoginInfo({ firstName: res.firstName, employments: res.employments });
      const goAccounts = res.requiresAccountSelection || !res.employmentId;
      await this.router.navigateByUrl(goAccounts ? '/cuentas' : '/');
    } catch (err) {
      this.code.set('');
      this.error.set(apiErrorMessage(err, 'El código no es válido'));
    } finally {
      this.busy.set(false);
    }
  }

  back(): void {
    this.step.set('destination');
    this.error.set(null);
    this.stopTimer();
  }

  private startResendTimer(): void {
    this.stopTimer();
    this.resendIn.set(RESEND_SECONDS);
    this.timer = setInterval(() => {
      const left = this.resendIn() - 1;
      this.resendIn.set(Math.max(0, left));
      if (left <= 0) this.stopTimer();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
