import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { firstValueFrom } from 'rxjs';
import { MeApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { EmployeeRequest, VacationBalance } from '../../core/api/models';
import { PUNCH_TYPE_LABEL, REQUEST_STATUS, REQUEST_TYPE_ICON, REQUEST_TYPE_LABEL, timeOf } from '../../shared/format';
import { IconComponent } from '../../shared/icon.component';
import { NewRequestData, NewRequestDialog } from './new-request.dialog';

/** A7 · Solicitudes: pendientes/resueltas, saldo de vacaciones y alta de solicitud. */
@Component({
  selector: 'att-requests-page',
  imports: [DatePipe, MatButtonModule, MatProgressBarModule, MatTabsModule, IconComponent],
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.scss',
})
export class RequestsPage implements OnInit {
  private readonly api = inject(MeApi);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly requests = signal<EmployeeRequest[]>([]);
  readonly balance = signal<VacationBalance | null>(null);
  readonly pending = computed(() => this.requests().filter((r) => r.requestStatus === 'pending'));
  readonly resolved = computed(() => this.requests().filter((r) => r.requestStatus !== 'pending'));
  readonly announce = signal('');
  readonly tab = signal(0);
  readonly visible = computed(() => (this.tab() === 0 ? this.pending() : this.resolved()));

  readonly typeLabel = REQUEST_TYPE_LABEL;
  readonly typeIcon = REQUEST_TYPE_ICON;
  readonly statusInfo = REQUEST_STATUS;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [requests, balance] = await Promise.all([
        firstValueFrom(this.api.requests()),
        firstValueFrom(this.api.vacationBalance()).catch(() => null),
      ]);
      this.requests.set([...requests].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));
      this.balance.set(balance);
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'No se pudieron cargar tus solicitudes'));
    } finally {
      this.loading.set(false);
    }
  }

  detail(r: EmployeeRequest): string {
    if (r.type === 'punch_correction') {
      const p = r.payload as { punchType?: keyof typeof PUNCH_TYPE_LABEL; at?: string };
      return `${p.punchType ? PUNCH_TYPE_LABEL[p.punchType] : 'Marcaje'} a las ${timeOf(p.at)}`;
    }
    if (r.type === 'overtime') return `${(r.payload as { minutes?: number }).minutes ?? 0} min`;
    return '';
  }

  async create(): Promise<void> {
    const created = await firstValueFrom(
      this.dialog.open<NewRequestDialog, NewRequestData, EmployeeRequest>(NewRequestDialog, { data: { balance: this.balance() }, maxWidth: '520px', width: '100%' }).afterClosed(),
    );
    if (created) {
      this.announce.set('Solicitud enviada');
      await this.load();
    }
  }

  async cancel(r: EmployeeRequest): Promise<void> {
    try {
      await firstValueFrom(this.api.cancelRequest(r.id));
      this.announce.set('Solicitud cancelada');
      await this.load();
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    }
  }
}
