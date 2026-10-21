import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { fakeJwt, waitForRequest } from '../../../testing/helpers';
import { API_URL } from '../api/api.services';
import { RegisterPunchBody } from '../api/models';
import { authInterceptor } from '../auth/auth.interceptor';
import { TokenService } from '../auth/token.service';
import { ConnectivityService } from '../offline/connectivity.service';
import { PunchQueueService } from '../offline/punch-queue.service';
import { PunchService, SELFIE_REQUIRED_KEY } from './punch.service';

const URL = `${API_URL}/me/punches`;
const isPunch = (u: string) => u === URL;

function punchResponse(body: RegisterPunchBody, extra: Record<string, unknown> = {}) {
  return {
    punch: { id: 'p1', type: body.type ?? 'in', effectiveAt: body.clientAt, riskFlags: [], reviewStatus: 'auto_ok', idempotencyKey: body.idempotencyKey, ...extra },
    duplicate: false,
    locationName: 'Sucursal Centro',
  };
}

describe('PunchService (flujo de marcaje y cola offline)', () => {
  let service: PunchService;
  let http: HttpTestingController;
  let queue: PunchQueueService;
  let connectivity: ConnectivityService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    TestBed.inject(TokenService).setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', accountId: 'a', employmentId: 'e', exp: Math.floor(Date.now() / 1000) + 3600 }));
    service = TestBed.inject(PunchService);
    http = TestBed.inject(HttpTestingController);
    queue = TestBed.inject(PunchQueueService);
    connectivity = TestBed.inject(ConnectivityService);
    await queue.clear();
  });

  afterEach(() => http.verify());

  it('en línea: manda idempotencyKey (UUID), clientAt y la ubicación redondeada', async () => {
    const now = new Date('2026-10-21T14:57:00.000Z');
    const pending = service.punch({ type: 'in', lat: 19.43, lng: -99.13, accuracyMeters: 12.7 }, now);
    const req = await waitForRequest(http, isPunch);
    const body = req.request.body as RegisterPunchBody;
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toMatch(/^Bearer /);
    expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(body).toEqual(expect.objectContaining({ clientAt: now.toISOString(), type: 'in', lat: 19.43, lng: -99.13, accuracyMeters: 13 }));
    expect(body.offline).toBeUndefined();
    req.flush(punchResponse(body));
    const outcome = await pending;
    expect(outcome.kind).toBe('sent');
    expect(queue.pendingCount()).toBe(0);
  });

  it('no manda accuracy sin coordenadas', async () => {
    const pending = service.punch({ type: 'out', accuracyMeters: 30 });
    const req = await waitForRequest(http, isPunch);
    expect(req.request.body).not.toHaveProperty('accuracyMeters');
    expect(req.request.body).not.toHaveProperty('lat');
    req.flush(punchResponse(req.request.body));
    await pending;
  });

  it('error de red (status 0) → se guarda en la cola con offline:true y no se pierde', async () => {
    const pending = service.punch({ type: 'in' });
    const req = await waitForRequest(http, isPunch);
    const key = req.request.body.idempotencyKey;
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    const outcome = await pending;
    expect(outcome.kind).toBe('queued');
    expect(connectivity.online()).toBe(false);
    const [stored] = await queue.refresh();
    expect(stored.idempotencyKey).toBe(key);
    expect(stored.body.offline).toBe(true);
    expect(stored.url).toMatch(/^https?:\/\/.*\/api\/v1\/me\/punches$/); // absoluta: la usa el SW
  });

  it('503 del servidor también se encola', async () => {
    const pending = service.punch({ type: 'in' });
    (await waitForRequest(http, isPunch)).flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });
    expect((await pending).kind).toBe('queued');
  });

  it('sin conexión ni siquiera intenta la petición', async () => {
    connectivity.markOffline();
    const outcome = await service.punch({ type: 'in' });
    expect(outcome.kind).toBe('queued');
    http.expectNone(URL);
    expect(queue.pendingCount()).toBe(1);
  });

  it('400 del API → error con el mensaje del servidor (no se encola)', async () => {
    const pending = service.punch({ type: 'in' });
    (await waitForRequest(http, isPunch)).flush({ statusCode: 400, message: 'Elige primero la empresa para la que checas' }, { status: 400, statusText: 'Bad Request' });
    const outcome = await pending;
    expect(outcome).toEqual({ kind: 'error', message: 'Elige primero la empresa para la que checas', status: 400 });
    expect(queue.pendingCount()).toBe(0);
  });

  it('recuerda que la política pide selfie si el API marca no_selfie', async () => {
    const pending = service.punch({ type: 'in' });
    const req = await waitForRequest(http, isPunch);
    req.flush(punchResponse(req.request.body, { riskFlags: ['no_selfie'], reviewStatus: 'pending' }));
    await pending;
    expect(localStorage.getItem(SELFIE_REQUIRED_KEY)).toBe('1');
  });

  describe('flush (reenvío al reconectar)', () => {
    async function queueTwo(): Promise<string[]> {
      connectivity.markOffline();
      const a = await service.punch({ type: 'in' }, new Date('2026-10-21T14:00:00Z'));
      const b = await service.punch({ type: 'out' }, new Date('2026-10-21T23:00:00Z'));
      return [a, b].map((o) => (o.kind === 'queued' ? o.item.idempotencyKey : ''));
    }

    it('envía en orden con offline:true y la misma idempotencyKey, y vacía la cola', async () => {
      const keys = await queueTwo();
      const flushed = jest.fn();
      service.flushed$.subscribe(flushed);
      const run = service.flush();
      const r1 = await waitForRequest(http, isPunch);
      expect(r1.request.body).toEqual(expect.objectContaining({ idempotencyKey: keys[0], offline: true, type: 'in', clientAt: '2026-10-21T14:00:00.000Z' }));
      r1.flush(punchResponse(r1.request.body));
      const r2 = await waitForRequest(http, isPunch);
      expect(r2.request.body.idempotencyKey).toBe(keys[1]);
      r2.flush(punchResponse(r2.request.body));
      expect(await run).toEqual({ sent: 2, rejected: 0, remaining: 0 });
      expect(flushed).toHaveBeenCalledWith({ sent: 2, rejected: 0, remaining: 0 });
    });

    it('si vuelve a fallar la red se detiene y conserva todo', async () => {
      await queueTwo();
      const run = service.flush();
      (await waitForRequest(http, isPunch)).error(new ProgressEvent('error'), { status: 0 });
      const summary = await run;
      expect(summary).toEqual({ sent: 0, rejected: 0, remaining: 2 });
      expect(queue.all()[0].attempts).toBe(1);
    });

    it('un 4xx marca el marcaje como rechazado y sigue con el siguiente', async () => {
      await queueTwo();
      const run = service.flush();
      (await waitForRequest(http, isPunch)).flush({ message: 'Tu empleo no está activo' }, { status: 400, statusText: 'Bad Request' });
      const r2 = await waitForRequest(http, isPunch);
      r2.flush(punchResponse(r2.request.body));
      expect(await run).toEqual({ sent: 1, rejected: 1, remaining: 0 });
      expect(queue.rejected()[0].lastError).toBe('Tu empleo no está activo');
      await service.dismiss(queue.rejected()[0].idempotencyKey);
      expect(queue.all()).toEqual([]);
    });

    it('un marcaje nuevo en línea espera a que se vacíe lo pendiente (orden)', async () => {
      const [k1] = await queueTwo().then((k) => k);
      // vuelve la red
      (connectivity as unknown as { state: { set(v: boolean): void } }).state.set(true);
      const pending = service.punch({ type: 'in' }, new Date('2026-10-22T14:00:00Z'));
      const first = await waitForRequest(http, isPunch);
      expect(first.request.body.idempotencyKey).toBe(k1);
      first.flush(punchResponse(first.request.body));
      const second = await waitForRequest(http, isPunch);
      second.flush(punchResponse(second.request.body));
      const third = await waitForRequest(http, isPunch);
      expect(third.request.body.offline).toBeUndefined();
      expect(third.request.body.clientAt).toBe('2026-10-22T14:00:00.000Z');
      third.flush(punchResponse(third.request.body));
      expect((await pending).kind).toBe('sent');
    });

    it('flush concurrentes comparten la misma corrida', async () => {
      await queueTwo();
      const a = service.flush();
      const b = service.flush();
      expect(a).toBe(b);
      (await waitForRequest(http, isPunch)).error(new ProgressEvent('error'), { status: 0 });
      await a;
    });

    it('el evento online dispara el reenvío', async () => {
      await queueTwo();
      service.start();
      // start() ya intenta vaciar al iniciar:
      (await waitForRequest(http, isPunch)).error(new ProgressEvent('error'), { status: 0 });
      await new Promise((r) => setTimeout(r, 20));
      window.dispatchEvent(new Event('online'));
      const req = await waitForRequest(http, isPunch);
      expect(req.request.body.offline).toBe(true);
      req.error(new ProgressEvent('error'), { status: 0 });
      await service.flush();
    });
  });
});
