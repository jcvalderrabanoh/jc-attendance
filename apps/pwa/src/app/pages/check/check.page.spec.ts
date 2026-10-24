import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { fakeJwt, waitForRequest } from '../../../testing/helpers';
import { API_URL } from '../../core/api/api.services';
import { MyStatus } from '../../core/api/models';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { GEO_CONSENT_KEY } from '../../core/auth/session.service';
import { TokenService } from '../../core/auth/token.service';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { PunchQueueService } from '../../core/offline/punch-queue.service';
import { PunchInput } from '../../core/punch/punch.service';
import { CheckPage } from './check.page';

function status(partial: Partial<MyStatus> = {}): MyStatus {
  return {
    now: new Date().toISOString(),
    timeZone: 'America/Mexico_City',
    state: 'out',
    todayMinutes: 0,
    weekMinutes: 0,
    perDay: [],
    shift: { startTime: '08:00:00', endTime: '17:00:00', breakMinutes: 60 },
    lastPunch: null,
    defaultLocation: { id: 'l1', name: 'Sucursal Centro', lat: 19.4, lng: -99.1, radiusMeters: 100 },
    accountName: 'Panadería La Espiga',
    ...partial,
  };
}

describe('CheckPage (A4)', () => {
  let fixture: ComponentFixture<CheckPage>;
  let page: CheckPage;
  let http: HttpTestingController;
  let sheetResult: PunchInput | undefined;
  let dialogResult: boolean;
  const sheet = { open: jest.fn(() => ({ afterDismissed: () => of(sheetResult) })) };
  const dialog = { open: jest.fn(() => ({ afterClosed: () => of(dialogResult) })) };
  const snack = { open: jest.fn() };

  async function create(initial: MyStatus): Promise<void> {
    fixture = TestBed.createComponent(CheckPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(`${API_URL}/me/status`).flush(initial);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    localStorage.clear();
    sheetResult = { type: 'in', lat: 19.4, lng: -99.1, accuracyMeters: 10 };
    dialogResult = true;
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [CheckPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: MatBottomSheet, useValue: sheet },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snack },
      ],
    });
    TestBed.inject(TokenService).setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', accountId: 'a', employmentId: 'e', exp: Math.floor(Date.now() / 1000) + 3600 }));
    TestBed.inject(TokenService).setLoginInfo({ firstName: 'Carlos', employments: [] });
    http = TestBed.inject(HttpTestingController);
    await TestBed.inject(PunchQueueService).clear();
  });

  afterEach(() => {
    fixture?.destroy();
    jest.useRealTimers();
  });

  it('muestra saludo, sucursal y "Registrar entrada" cuando está fuera', async () => {
    await create(status());
    expect(text()).toContain('¡Hola, Carlos!');
    expect(text()).toContain('Sucursal Centro');
    expect(text()).toContain('Registrar entrada');
    expect(text()).toContain('Estás fuera');
    expect(text()).toContain('08:00 – 17:00');
  });

  it('dentro: botón "Registrar salida" y descanso como secundario', async () => {
    await create(status({ state: 'in', todayMinutes: 125 }));
    expect(page.primary().label).toBe('Registrar salida');
    expect(text()).toContain('Iniciar descanso');
    expect(text()).toContain('2 h 05 min');
  });

  it('el contador de hoy avanza cada 30 s mientras está dentro', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'queueMicrotask', 'nextTick'] });
    await create(status({ state: 'in', todayMinutes: 60 }));
    expect(page.todayMinutes()).toBe(60);
    jest.advanceTimersByTime(5 * 60_000);
    expect(page.todayMinutes()).toBe(65);
    fixture.detectChanges();
    expect(text()).toContain('1 h 05 min');
  });

  it('el contador NO avanza si está fuera', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'queueMicrotask', 'nextTick'] });
    await create(status({ state: 'out', todayMinutes: 60 }));
    jest.advanceTimersByTime(10 * 60_000);
    expect(page.todayMinutes()).toBe(60);
  });

  it('pide el consentimiento de ubicación una sola vez y lo registra en el API', async () => {
    await create(status());
    const granted = page.ensureGeoConsent();
    (await waitForRequest(http, (u) => u === `${API_URL}/employee-auth/consents`)).flush([]);
    const post = await waitForRequest(http, (u) => u === `${API_URL}/employee-auth/consents`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ kinds: ['geolocation'] });
    post.flush([{ kind: 'geolocation' }]);
    expect(await granted).toBe(true);
    expect(localStorage.getItem(GEO_CONSENT_KEY)).toBe('granted');
    expect(await page.ensureGeoConsent()).toBe(true);
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('si lo rechaza, checa sin ubicación y no vuelve a preguntar', async () => {
    dialogResult = false;
    await create(status());
    const r = page.ensureGeoConsent();
    (await waitForRequest(http, (u) => u.endsWith('/employee-auth/consents'))).flush([]);
    expect(await r).toBe(false);
    expect(await page.ensureGeoConsent()).toBe(false);
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('marcaje en línea: hoja A5 → POST /me/punches → anuncio en aria-live y recarga', async () => {
    localStorage.setItem(GEO_CONSENT_KEY, 'granted');
    await create(status());
    const run = page.start(page.primary());
    const req = await waitForRequest(http, (u) => u === `${API_URL}/me/punches`);
    expect(sheet.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ useGeo: true, locationName: 'Sucursal Centro' }) }));
    expect(req.request.body).toEqual(expect.objectContaining({ type: 'in', lat: 19.4, lng: -99.1, accuracyMeters: 10 }));
    req.flush({
      punch: { id: 'p', type: 'in', effectiveAt: '2026-10-21T14:57:00.000Z', riskFlags: [], reviewStatus: 'auto_ok' },
      duplicate: false,
      locationName: 'Sucursal Centro',
    });
    (await waitForRequest(http, (u) => u === `${API_URL}/me/status`)).flush(status({ state: 'in' }));
    await run;
    fixture.detectChanges();
    const live = (fixture.nativeElement as HTMLElement).querySelector('[aria-live="assertive"]')!;
    expect(live.textContent).toContain('Entrada registrada 08:57');
    expect(page.primary().label).toBe('Registrar salida');
  });

  it('hoja cancelada: no se registra nada', async () => {
    localStorage.setItem(GEO_CONSENT_KEY, 'granted');
    sheetResult = undefined;
    await create(status());
    await page.start(page.primary());
    http.expectNone(`${API_URL}/me/punches`);
    expect(page.feedback()).toBeNull();
  });

  it('sin conexión: se encola, cambia el estado localmente y avisa', async () => {
    localStorage.setItem(GEO_CONSENT_KEY, 'declined');
    await create(status({ state: 'out' }));
    TestBed.inject(ConnectivityService).markOffline();
    await page.start(page.primary());
    http.expectNone(`${API_URL}/me/punches`);
    expect(page.state()).toBe('in');
    expect(page.feedback()?.title).toBe('Sin conexión: se enviará al reconectar');
    expect(TestBed.inject(PunchQueueService).pendingCount()).toBe(1);
    fixture.detectChanges();
    expect(text()).toContain('Registrar salida');
  });

  it('error del API: lo muestra sin encolar', async () => {
    localStorage.setItem(GEO_CONSENT_KEY, 'declined');
    await create(status());
    const run = page.start(page.primary());
    (await waitForRequest(http, (u) => u.endsWith('/me/punches'))).flush({ message: 'Estás fuera de la zona de Sucursal Centro (420 m)' }, { status: 400, statusText: 'Bad Request' });
    await run;
    expect(page.feedback()).toEqual({ tone: 'bad', title: 'No se registró', detail: 'Estás fuera de la zona de Sucursal Centro (420 m)' });
  });

  it('usa el último estado guardado si no hay red al abrir', async () => {
    await create(status({ state: 'in', todayMinutes: 30 }));
    fixture.destroy();
    fixture = TestBed.createComponent(CheckPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
    expect(page.state()).toBe('in'); // desde caché, antes de que responda el API
    http.expectOne(`${API_URL}/me/status`).error(new ProgressEvent('error'), { status: 0 });
    await fixture.whenStable();
    expect(page.loadError()).toBeNull();
  });
});
