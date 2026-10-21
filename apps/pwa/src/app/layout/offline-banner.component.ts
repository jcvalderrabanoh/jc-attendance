import { Component, computed, inject } from '@angular/core';
import { ConnectivityService } from '../core/offline/connectivity.service';
import { PunchQueueService } from '../core/offline/punch-queue.service';
import { IconComponent } from '../shared/icon.component';

/** Banner discreto de conexión y marcajes en cola. */
@Component({
  selector: 'att-offline-banner',
  imports: [IconComponent],
  template: `
    @if (message(); as m) {
      <div class="banner" [class.offline]="!online()" role="status">
        <att-icon [name]="online() ? 'cloud_sync' : 'cloud_off'" [size]="20" />
        <span>{{ m }}</span>
      </div>
    }
  `,
  styles: `
    .banner {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; font-size: 0.9rem; font-weight: 600;
      background: var(--att-primary-soft); color: var(--att-primary-dark);
      padding-top: max(10px, env(safe-area-inset-top));
    }
    .banner.offline { background: #fde3bd; color: #5c3900; }
  `,
})
export class OfflineBannerComponent {
  private readonly connectivity = inject(ConnectivityService);
  private readonly queue = inject(PunchQueueService);
  readonly online = this.connectivity.online;

  readonly message = computed(() => {
    const n = this.queue.pendingCount();
    const plural = n === 1 ? '1 marcaje pendiente' : `${n} marcajes pendientes`;
    if (!this.online()) return n ? `Sin conexión: se enviará al reconectar (${plural})` : 'Sin conexión: se enviará al reconectar';
    if (n) return `Enviando ${plural}…`;
    return null;
  });
}
