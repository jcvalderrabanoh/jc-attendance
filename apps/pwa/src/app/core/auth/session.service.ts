import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmployeeAuthApi } from '../api/api.services';
import { safeStorage } from './storage';
import { TokenService } from './token.service';

export const DEFAULT_EMPLOYMENT_KEY = 'att.defaultEmployment';
export const STATUS_CACHE_KEY = 'att.lastStatus';
export const GEO_CONSENT_KEY = 'att.geoConsent';
export const PRIVACY_URL_KEY = 'att.privacyNoticeUrl';

/** Cambiar de patrón y cerrar sesión. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(EmployeeAuthApi);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  async selectEmployment(employmentId: string): Promise<void> {
    const res = await firstValueFrom(this.api.selectEmployment(employmentId));
    this.tokens.setEmployeeToken(res.token);
    safeStorage.remove(STATUS_CACHE_KEY);
    safeStorage.remove(GEO_CONSENT_KEY);
  }

  defaultEmployment(): string | null {
    return safeStorage.get(DEFAULT_EMPLOYMENT_KEY);
  }

  setDefaultEmployment(id: string | null): void {
    if (id) safeStorage.set(DEFAULT_EMPLOYMENT_KEY, id);
    else safeStorage.remove(DEFAULT_EMPLOYMENT_KEY);
  }

  async logout(): Promise<void> {
    this.tokens.clearEmployee();
    safeStorage.remove(STATUS_CACHE_KEY);
    safeStorage.remove(GEO_CONSENT_KEY);
    await this.router.navigateByUrl('/entrar');
  }
}
