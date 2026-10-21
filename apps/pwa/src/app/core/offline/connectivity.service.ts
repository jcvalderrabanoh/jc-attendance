import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Estado de red del navegador (`navigator.onLine` + eventos online/offline). */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly state = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  readonly online = this.state.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;
    const up = () => this.state.set(true);
    const down = () => this.state.set(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    });
  }

  /** Lo usa el servicio de marcaje cuando una petición falla por red. */
  markOffline(): void {
    this.state.set(false);
  }
}
