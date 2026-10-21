import { TestBed } from '@angular/core/testing';
import { PunchQueueService, QueuedPunch } from './punch-queue.service';

function item(key: string, clientAt: string, extra: Partial<QueuedPunch> = {}): QueuedPunch {
  return {
    idempotencyKey: key,
    url: 'http://localhost:3100/api/v1/me/punches',
    token: 't',
    body: { idempotencyKey: key, clientAt, offline: true },
    queuedAt: clientAt,
    attempts: 0,
    ...extra,
  };
}

describe('PunchQueueService (IndexedDB)', () => {
  let queue: PunchQueueService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    queue = TestBed.inject(PunchQueueService);
    await queue.clear();
  });

  it('guarda marcajes y los devuelve en orden de clientAt', async () => {
    await queue.enqueue(item('b', '2026-10-21T15:00:00.000Z'));
    await queue.enqueue(item('a', '2026-10-21T08:00:00.000Z'));
    const rows = await queue.refresh();
    expect(rows.map((r) => r.idempotencyKey)).toEqual(['a', 'b']);
    expect(queue.pendingCount()).toBe(2);
  });

  it('la idempotencyKey es la clave: guardar dos veces no duplica', async () => {
    await queue.enqueue(item('a', '2026-10-21T08:00:00.000Z'));
    await queue.enqueue(item('a', '2026-10-21T08:00:00.000Z', { attempts: 1 }));
    expect(queue.all().length).toBe(1);
    expect(queue.all()[0].attempts).toBe(1);
  });

  it('separa pendientes de rechazados', async () => {
    await queue.enqueue(item('a', '2026-10-21T08:00:00.000Z'));
    await queue.enqueue(item('b', '2026-10-21T09:00:00.000Z'));
    await queue.update({ ...item('b', '2026-10-21T09:00:00.000Z'), rejected: true, lastError: 'Empleo inactivo' });
    expect(queue.pendingCount()).toBe(1);
    expect(queue.rejected().map((r) => r.lastError)).toEqual(['Empleo inactivo']);
  });

  it('quita un marcaje enviado', async () => {
    await queue.enqueue(item('a', '2026-10-21T08:00:00.000Z'));
    await queue.remove('a');
    expect(queue.pendingCount()).toBe(0);
    expect(await queue.refresh()).toEqual([]);
  });

  it('persiste entre instancias (otra pestaña / reapertura en iOS)', async () => {
    await queue.enqueue(item('a', '2026-10-21T08:00:00.000Z'));
    const other = new PunchQueueService();
    expect((await other.refresh()).map((r) => r.idempotencyKey)).toEqual(['a']);
  });
});
