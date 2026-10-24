import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MeApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { MyEmployment, MyOnboardingRequest } from '../../core/api/models';
import { SessionService } from '../../core/auth/session.service';
import { TokenService } from '../../core/auth/token.service';
import { BrandHeaderComponent } from '../../shared/brand-header.component';
import { IconComponent } from '../../shared/icon.component';

/** A3 · Selector de patrón: empresas donde trabaja el empleado. */
@Component({
  selector: 'att-accounts-page',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, BrandHeaderComponent, IconComponent],
  templateUrl: './accounts.page.html',
  styleUrl: './accounts.page.scss',
})
export class AccountsPage implements OnInit {
  private readonly api = inject(MeApi);
  private readonly session = inject(SessionService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly employments = signal<MyEmployment[]>([]);
  readonly onboarding = signal<MyOnboardingRequest[]>([]);
  readonly defaultId = signal<string | null>(this.session.defaultEmployment());
  readonly firstName = computed(() => this.tokens.loginInfo()?.firstName ?? '');
  readonly currentId = computed(() => this.tokens.employeeClaims()?.employmentId ?? null);
  readonly approvedCount = computed(() => this.employments().filter((e) => e.onboardingStatus === 'approved').length);

  async ngOnInit(): Promise<void> {
    try {
      const [employments, onboarding] = await Promise.all([
        firstValueFrom(this.api.employments()),
        firstValueFrom(this.api.onboarding()).catch(() => [] as MyOnboardingRequest[]),
      ]);
      this.employments.set(employments);
      this.onboarding.set(onboarding);
      // Sin patrón elegido: si fijó uno predeterminado (o solo hay uno aprobado) entra directo.
      if (!this.tokens.hasEmployment()) {
        const approved = employments.filter((e) => e.onboardingStatus === 'approved');
        const pick = approved.find((e) => e.employmentId === this.defaultId()) ?? (approved.length === 1 ? approved[0] : null);
        if (pick) await this.choose(pick);
      }
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  /** Alta con «pedir información»: el empleado corrige y la reenvía. */
  readonly fixingId = signal<string | null>(null);
  fix: Record<string, string> = { email: '', curp: '', rfc: '', nss: '' };

  needsInfo(e: MyEmployment): MyOnboardingRequest | undefined {
    const r = this.reviewFor(e);
    return r?.reviewStatus === 'needs_info' ? r : undefined;
  }

  async resubmit(request: MyOnboardingRequest): Promise<void> {
    const identity = Object.fromEntries(Object.entries(this.fix).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
    this.error.set(null);
    try {
      await firstValueFrom(this.api.resubmitOnboarding(request.id, { identity }));
      this.fixingId.set(null);
      this.onboarding.set(await firstValueFrom(this.api.onboarding()));
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    }
  }

  reviewFor(e: MyEmployment): MyOnboardingRequest | undefined {
    return this.onboarding().find((r) => r.accountId === e.accountId);
  }

  async choose(e: MyEmployment): Promise<void> {
    if (e.onboardingStatus !== 'approved' || this.busyId()) return;
    this.busyId.set(e.employmentId);
    this.error.set(null);
    try {
      await this.session.selectEmployment(e.employmentId);
      await this.router.navigateByUrl('/');
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.busyId.set(null);
    }
  }

  toggleDefault(e: MyEmployment, event: Event): void {
    event.stopPropagation();
    const next = this.defaultId() === e.employmentId ? null : e.employmentId;
    this.session.setDefaultEmployment(next);
    this.defaultId.set(next);
  }

  logout(): void {
    void this.session.logout();
  }
}
