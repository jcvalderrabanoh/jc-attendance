import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmployeeAuthApi, MeApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { Consent, ConsentKind, CustomFieldDefinition, MyEmployment, MyProfile } from '../../core/api/models';
import { GEO_CONSENT_KEY, PRIVACY_URL_KEY, SessionService } from '../../core/auth/session.service';
import { safeStorage } from '../../core/auth/storage';
import { TokenService } from '../../core/auth/token.service';
import { IconComponent } from '../../shared/icon.component';


/** A8 · Perfil: datos, campos personalizados editables, privacidad y sesión. */
@Component({
  selector: 'att-profile-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSelectModule, MatSlideToggleModule, IconComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  private readonly me = inject(MeApi);
  private readonly authApi = inject(EmployeeAuthApi);
  private readonly session = inject(SessionService);
  private readonly tokens = inject(TokenService);
  private readonly snack = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly profile = signal<MyProfile | null>(null);
  readonly consents = signal<Consent[]>([]);
  readonly employments = signal<MyEmployment[]>([]);
  readonly privacyUrl = safeStorage.get(PRIVACY_URL_KEY);
  readonly hasEmployment = computed(() => this.tokens.hasEmployment());
  readonly currentAccount = computed(() => this.employments().find((e) => e.employmentId === this.tokens.employeeClaims()?.employmentId) ?? null);

  email = '';
  values: Record<string, unknown> = {};

  readonly fullName = computed(() => {
    const i = this.profile()?.identity;
    return i ? `${i.firstName} ${i.lastName}` : '';
  });
  readonly editable = computed(() => (this.profile()?.customFieldDefinitions ?? []).filter((f) => f.editableByEmployee));
  readonly readonlyFields = computed(() => (this.profile()?.customFieldDefinitions ?? []).filter((f) => !f.editableByEmployee));

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [profile, consents, employments] = await Promise.all([
        firstValueFrom(this.me.profile()),
        firstValueFrom(this.authApi.consents()).catch(() => [] as Consent[]),
        firstValueFrom(this.me.employments()).catch(() => [] as MyEmployment[]),
      ]);
      this.profile.set(profile);
      this.consents.set(consents);
      this.employments.set(employments);
      this.email = profile.identity.email ?? '';
      this.values = { ...(profile.employment?.customFields ?? {}) };
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'No se pudo cargar tu perfil'));
    } finally {
      this.loading.set(false);
    }
  }

  granted(kind: ConsentKind): boolean {
    return this.consents().some((c) => c.kind === kind && !c.revokedAt);
  }

  display(f: CustomFieldDefinition): string {
    const v = this.values[f.key];
    if (v === undefined || v === null || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    const body: { email?: string; customFields?: Record<string, unknown> } = {};
    const email = this.email.trim();
    if (email && email !== (this.profile()?.identity.email ?? '')) body.email = email;
    if (this.editable().length) {
      body.customFields = Object.fromEntries(this.editable().map((f) => [f.key, f.type === 'number' && this.values[f.key] !== '' ? Number(this.values[f.key]) : this.values[f.key]]));
    }
    try {
      const updated = await firstValueFrom(this.me.updateProfile(body));
      this.profile.set(updated);
      this.values = { ...(updated.employment?.customFields ?? {}) };
      this.snack.open('Datos guardados', 'OK', { duration: 3000, panelClass: 'snack-ok' });
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'No se pudieron guardar tus datos'));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleConsent(kind: ConsentKind, event: MatSlideToggleChange): Promise<void> {
    try {
      const next = await firstValueFrom(event.checked ? this.authApi.grant([kind]) : this.authApi.revoke(kind));
      this.consents.set(next);
      if (kind === 'geolocation') safeStorage.set(GEO_CONSENT_KEY, event.checked ? 'granted' : 'declined');
    } catch (err) {
      event.source.checked = !event.checked;
      this.snack.open(apiErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-bad' });
    }
  }

  /** Descarga en JSON todos sus datos personales (derecho de acceso, LFPDPPP). */
  async downloadMyData(): Promise<void> {
    try {
      const data = await firstValueFrom(this.me.dataExport());
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis-datos-checador-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.snack.open(apiErrorMessage(err), 'Cerrar', { duration: 5000 });
    }
  }

  logout(): void {
    void this.session.logout();
  }
}
