import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { OfflineBannerComponent } from './offline-banner.component';

/** Marco de las pantallas del empleado: banner de conexión + navegación inferior. */
@Component({
  selector: 'att-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, OfflineBannerComponent],
  template: `
    <att-offline-banner />
    <main id="contenido" class="content">
      <router-outlet />
    </main>
    <nav class="bottom-nav" aria-label="Navegación principal">
      @for (item of items; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.path === '/' }"
          #rla="routerLinkActive"
          [attr.aria-current]="rla.isActive ? 'page' : null"
        >
          <span class="pill"><att-icon [name]="item.icon" [fill]="rla.isActive" /></span>
          <span class="label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100dvh; }
    .content { flex: 1; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
    .bottom-nav {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 10;
      display: grid; grid-template-columns: repeat(4, 1fr);
      background: #fff; border-top: 1px solid var(--att-line);
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
    }
    a {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
      min-height: 56px; text-decoration: none; color: var(--att-muted); font-size: 0.78rem; font-weight: 600;
    }
    .pill { display: inline-flex; padding: 4px 18px; border-radius: 999px; transition: background .2s; }
    a.active { color: var(--att-primary); }
    a.active .pill { background: #cde6ec; }
  `,
})
export class ShellComponent {
  readonly items = [
    { path: '/', label: 'Checar', icon: 'schedule' },
    { path: '/historial', label: 'Historial', icon: 'history' },
    { path: '/solicitudes', label: 'Solicitudes', icon: 'assignment' },
    { path: '/perfil', label: 'Perfil', icon: 'person' },
  ];
}
