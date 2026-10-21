import { Injectable, computed, signal } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { RegisterPunchBody } from '../api/models';

export const QUEUE_DB = 'att-offline';
export const QUEUE_STORE = 'punches';
export const SYNC_TAG = 'att-punch-queue';

/** Marcaje guardado sin red. Lo lee también el service worker (`public/sw-main.js`). */
export interface QueuedPunch {
  idempotencyKey: string;
  /** URL absoluta de POST /me/punches (el SW no conoce el environment). */
  url: string;
  /** Token al momento de checar, para el Background Sync del SW. */
  token: string | null;
  body: RegisterPunchBody;
  queuedAt: string;
  attempts: number;
  /** El API lo rechazó (4xx): ya no se reintenta; se muestra al empleado. */
  rejected?: boolean;
  lastError?: string;
}

interface QueueDb extends DBSchema {
  punches: { key: string; value: QueuedPunch };
}

/**
 * Cola de marcajes offline en IndexedDB. La clave es la `idempotencyKey`,
 * así que reenviar el mismo marcaje nunca lo duplica en el servidor.
 */
@Injectable({ providedIn: 'root' })
export class PunchQueueService {
  private dbPromise: Promise<IDBPDatabase<QueueDb>> | null = null;
  private readonly items = signal<QueuedPunch[]>([]);

  readonly all = this.items.asReadonly();
  readonly pending = computed(() => this.items().filter((i) => !i.rejected));
  readonly rejected = computed(() => this.items().filter((i) => i.rejected));
  readonly pendingCount = computed(() => this.pending().length);

  private db(): Promise<IDBPDatabase<QueueDb>> {
    this.dbPromise ??= openDB<QueueDb>(QUEUE_DB, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'idempotencyKey' });
      },
    });
    return this.dbPromise;
  }

  /** Relee la cola (al iniciar, o cuando el SW avisa que la vació). */
  async refresh(): Promise<QueuedPunch[]> {
    try {
      const rows = await (await this.db()).getAll(QUEUE_STORE);
      rows.sort((a, b) => a.body.clientAt.localeCompare(b.body.clientAt));
      this.items.set(rows);
      return rows;
    } catch {
      return this.items();
    }
  }

  async enqueue(item: QueuedPunch): Promise<void> {
    await (await this.db()).put(QUEUE_STORE, item);
    await this.refresh();
  }

  async update(item: QueuedPunch): Promise<void> {
    await (await this.db()).put(QUEUE_STORE, item);
    await this.refresh();
  }

  async remove(idempotencyKey: string): Promise<void> {
    await (await this.db()).delete(QUEUE_STORE, idempotencyKey);
    await this.refresh();
  }

  /** Para pruebas y al cerrar sesión. */
  async clear(): Promise<void> {
    await (await this.db()).clear(QUEUE_STORE);
    await this.refresh();
  }
}
