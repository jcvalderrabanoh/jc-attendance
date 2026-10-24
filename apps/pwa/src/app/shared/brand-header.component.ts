import { Component, input } from '@angular/core';

/** Encabezado de marca de las pantallas públicas (alta, entrar). */
@Component({
  selector: 'att-brand-header',
  template: `
    <header class="brand">
      <img src="icons/icon-192.png" alt="" width="44" height="44" />
      <div>
        <div class="name">Checador</div>
        <div class="tag">{{ tagline() }}</div>
      </div>
    </header>
  `,
  styles: `
    .brand { display: flex; align-items: center; gap: 12px; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); background: #fff; border-bottom: 1px solid var(--att-line); }
    img { border-radius: 12px; }
    .name { font-weight: 800; font-size: 1.25rem; color: var(--att-primary-dark); }
    .tag { font-size: 0.85rem; color: var(--att-muted); }
  `,
})
export class BrandHeaderComponent {
  readonly tagline = input('Registro de asistencia');
}
