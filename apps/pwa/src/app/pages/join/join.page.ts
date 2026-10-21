import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { JoinApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { ConsentKind, CustomFieldDefinition, IdentityData, JoinInfo, SubmitOnboardingResult } from '../../core/api/models';
import { safeStorage } from '../../core/auth/storage';
import { TokenService } from '../../core/auth/token.service';
import { BrandHeaderComponent } from '../../shared/brand-header.component';
import { IconComponent } from '../../shared/icon.component';
import { OtpInputComponent } from '../../shared/otp-input.component';
import { maskDestination, toE164Mx } from '../../shared/phone';
import { PRIVACY_URL_KEY } from '../../core/auth/session.service';
import { CURP_RE, NSS_RE, RFC_RE, cleanCustomFields, mxPhoneValidator, emailDomainValidator, splitServerErrors, validatorsFor } from './join.logic';

/** A1 · Alta por liga: datos + OTP → datos laborales y campos → consentimientos. */
@Component({
  selector: 'att-join-page',
  imports: [ReactiveFormsModule, MatStepperModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSelectModule, BrandHeaderComponent, IconComponent, OtpInputComponent],
  templateUrl: './join.page.html',
  styleUrl: './join.page.scss',
})
export class JoinPage implements OnInit {
  private readonly api = inject(JoinApi);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Parámetro de ruta (`/unirse/:token`). */
  readonly token = input.required<string>();

  readonly info = signal<JoinInfo | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly otpSent = signal(false);
  readonly otpBusy = signal(false);
  readonly otpError = signal<string | null>(null);
  readonly resendIn = signal(0);
  readonly submitting = signal(false);
  readonly serverErrors = signal<string[]>([]);
  readonly result = signal<SubmitOnboardingResult | null>(null);
  readonly otpCode = signal('');

  readonly personal = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, mxPhoneValidator]],
    email: ['', [Validators.email]],
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly work = this.fb.nonNullable.group({
    curp: ['', [Validators.pattern(CURP_RE)]],
    rfc: ['', [Validators.pattern(RFC_RE)]],
    nss: ['', [Validators.pattern(NSS_RE)]],
    birthDate: [''],
    custom: new FormGroup<Record<string, FormControl<unknown>>>({}),
  });

  readonly consents = this.fb.nonNullable.group({
    privacy: [false, Validators.requiredTrue],
    geolocation: [true],
    biometric: [false],
  });

  readonly required = computed(() => new Set(this.info()?.requiredFields ?? []));
  readonly customFields = computed<CustomFieldDefinition[]>(() => this.info()?.customFields ?? []);
  readonly maskDestination = maskDestination;
  private timer: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const info = await firstValueFrom(this.api.info(this.token()));
      this.info.set(info);
      if (info.privacyNoticeUrl) safeStorage.set(PRIVACY_URL_KEY, info.privacyNoticeUrl);
      this.applyRequirements(info);
    } catch (err) {
      this.loadError.set(apiErrorMessage(err, 'Esta liga no es válida o ya venció'));
    } finally {
      this.loading.set(false);
    }
  }

  private applyRequirements(info: JoinInfo): void {
    const req = new Set(info.requiredFields);
    const email = this.personal.controls.email;
    email.setValidators([Validators.email, emailDomainValidator(info.allowedEmailDomains ?? []), ...(req.has('email') ? [Validators.required] : [])]);
    email.updateValueAndValidity();
    for (const key of ['curp', 'rfc', 'nss', 'birthDate'] as const) {
      if (req.has(key)) {
        this.work.controls[key].addValidators(Validators.required);
        this.work.controls[key].updateValueAndValidity();
      }
    }
    const custom = this.work.controls.custom;
    for (const f of info.customFields) {
      const initial = f.type === 'boolean' ? false : f.type === 'multiselect' ? [] : '';
      custom.addControl(f.key, new FormControl<unknown>(initial, validatorsFor(f)));
    }
  }

  upper(control: 'curp' | 'rfc'): void {
    const c = this.work.controls[control];
    c.setValue(c.value.toUpperCase().replace(/\s/g, ''), { emitEvent: false });
  }

  async sendOtp(): Promise<void> {
    const phone = this.personal.controls.phone;
    phone.markAsTouched();
    if (phone.invalid) return;
    this.otpBusy.set(true);
    this.otpError.set(null);
    try {
      await firstValueFrom(this.api.requestOtp(this.token(), toE164Mx(phone.value)));
      this.otpSent.set(true);
      this.startTimer();
    } catch (err) {
      this.otpError.set(apiErrorMessage(err, 'No pudimos enviar el código'));
    } finally {
      this.otpBusy.set(false);
    }
  }

  onOtp(code: string): void {
    this.otpCode.set(code);
    this.personal.controls.otp.setValue(code);
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.resendIn.set(60);
    this.timer = setInterval(() => {
      this.resendIn.update((n) => Math.max(0, n - 1));
      if (this.resendIn() === 0 && this.timer) clearInterval(this.timer);
    }, 1000);
  }

  async submit(): Promise<void> {
    if (this.personal.invalid || this.work.invalid || this.consents.invalid) {
      this.personal.markAllAsTouched();
      this.work.markAllAsTouched();
      this.consents.markAllAsTouched();
      this.serverErrors.set(['Revisa los campos marcados en los pasos anteriores']);
      return;
    }
    const p = this.personal.getRawValue();
    const w = this.work.getRawValue();
    const c = this.consents.getRawValue();
    const identity: IdentityData = { firstName: p.firstName.trim(), lastName: p.lastName.trim(), phone: toE164Mx(p.phone) };
    if (p.email.trim()) identity.email = p.email.trim().toLowerCase();
    if (w.curp) identity.curp = w.curp;
    if (w.rfc) identity.rfc = w.rfc;
    if (w.nss) identity.nss = w.nss;
    if (w.birthDate) identity.birthDate = w.birthDate;
    const consents: ConsentKind[] = ['privacy_notice'];
    if (c.geolocation) consents.push('geolocation');
    if (c.biometric) consents.push('biometric');

    this.submitting.set(true);
    this.serverErrors.set([]);
    try {
      const res = await firstValueFrom(
        this.api.submit(this.token(), { identity, otpCode: p.otp, customFields: cleanCustomFields(this.customFields(), w.custom as Record<string, unknown>), consents }),
      );
      this.tokens.setEmployeeToken(res.token);
      this.tokens.setLoginInfo({ firstName: identity.firstName, employments: [] });
      this.result.set(res);
    } catch (err) {
      this.serverErrors.set(splitServerErrors(apiErrorMessage(err, 'No se pudo enviar tu alta')));
    } finally {
      this.submitting.set(false);
    }
  }

  goToApp(): void {
    void this.router.navigateByUrl(this.result()?.reviewStatus === 'approved' ? '/' : '/cuentas');
  }
}
