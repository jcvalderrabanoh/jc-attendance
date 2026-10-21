import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { IconComponent } from '../../shared/icon.component';

/** Se pide una sola vez antes del primer marcaje. */
@Component({
  selector: 'att-geo-consent-dialog',
  imports: [MatDialogModule, MatButtonModule, IconComponent],
  template: `
    <h2 mat-dialog-title><att-icon name="location_on" /> ¿Compartir tu ubicación al checar?</h2>
    <mat-dialog-content>
      <p>Tu empresa usa la ubicación <strong>solo en el momento de checar</strong> para confirmar que estás en tu sucursal.</p>
      <p>No te rastreamos durante el día. Puedes retirar este permiso en <em>Perfil › Privacidad</em>.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Ahora no</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true" cdkFocusInitial>Sí, compartir</button>
    </mat-dialog-actions>
  `,
  styles: `h2 { display: flex; align-items: center; gap: 8px; }`,
})
export class GeoConsentDialog {}
