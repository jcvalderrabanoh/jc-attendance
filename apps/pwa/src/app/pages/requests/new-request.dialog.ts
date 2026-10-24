import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { MeApi } from '../../core/api/api.services';
import { apiErrorMessage } from '../../core/api/api-error';
import { CreateRequestBody, EmployeeRequest, RequestType, VacationBalance } from '../../core/api/models';
import { PUNCH_TYPE_LABEL, REQUEST_TYPE_ICON, REQUEST_TYPE_LABEL, isoDate } from '../../shared/format';
import { IconComponent } from '../../shared/icon.component';

export interface NewRequestData {
  balance: VacationBalance | null;
}

/** Arma el cuerpo de POST /me/requests según el tipo. */
export function buildRequestBody(v: {
  type: RequestType;
  fromDate: string;
  toDate: string;
  punchType: string;
  time: string;
  minutes: number | null;
  comment: string;
}): CreateRequestBody {
  const single = v.type === 'punch_correction' || v.type === 'overtime';
  const body: CreateRequestBody = { type: v.type, fromDate: v.fromDate, toDate: single ? v.fromDate : v.toDate || v.fromDate };
  if (v.type === 'punch_correction') {
    body.payload = { punchType: v.punchType, at: new Date(`${v.fromDate}T${v.time}:00`).toISOString() };
  } else if (v.type === 'overtime') {
    body.payload = { minutes: Number(v.minutes) };
  }
  if (v.comment.trim()) body.comment = v.comment.trim();
  return body;
}

@Component({
  selector: 'att-new-request-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatSelectModule, IconComponent],
  templateUrl: './new-request.dialog.html',
  styles: `
    .types { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; width: 100%; border: 0; }
    .types .mat-button-toggle { border: 1px solid var(--att-line) !important; border-radius: 12px; }
    .types ::ng-deep .mat-button-toggle-label-content { display: flex; align-items: center; gap: 6px; padding: 8px 10px; line-height: 1.2; min-height: 48px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    mat-form-field { width: 100%; }
  `,
})
export class NewRequestDialog {
  private readonly api = inject(MeApi);
  private readonly ref = inject<MatDialogRef<NewRequestDialog, EmployeeRequest>>(MatDialogRef);
  readonly data = inject<NewRequestData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly types: RequestType[] = ['vacation', 'permission', 'sick_leave', 'punch_correction', 'overtime'];
  readonly typeLabel = REQUEST_TYPE_LABEL;
  readonly typeIcon = REQUEST_TYPE_ICON;
  readonly punchTypes = Object.entries(PUNCH_TYPE_LABEL);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<RequestType>('vacation', Validators.required),
    fromDate: [isoDate(new Date()), Validators.required],
    toDate: [isoDate(new Date())],
    punchType: ['in'],
    time: ['09:00'],
    minutes: this.fb.control<number | null>(null),
    comment: ['', Validators.maxLength(500)],
  });

  get type(): RequestType {
    return this.form.controls.type.value;
  }

  async submit(): Promise<void> {
    const v = this.form.getRawValue();
    if (!v.fromDate) return this.error.set('Elige la fecha');
    if (!['punch_correction', 'overtime'].includes(v.type) && v.toDate && v.toDate < v.fromDate) return this.error.set('La fecha final es anterior a la inicial');
    if (v.type === 'overtime' && !(Number(v.minutes) > 0)) return this.error.set('Indica los minutos de tiempo extra');
    if (v.type === 'punch_correction' && !v.time) return this.error.set('Indica la hora correcta');
    this.busy.set(true);
    this.error.set(null);
    try {
      const created = await firstValueFrom(this.api.createRequest(buildRequestBody(v)));
      this.ref.close(created);
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'No se pudo enviar la solicitud'));
    } finally {
      this.busy.set(false);
    }
  }
}
