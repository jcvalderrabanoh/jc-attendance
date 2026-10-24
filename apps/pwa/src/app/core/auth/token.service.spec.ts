import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { fakeJwt } from '../../../testing/helpers';
import { API_URL } from '../api/api.services';
import { authInterceptor } from './auth.interceptor';
import { employmentGuard, kioskGuard } from './guards';
import { EMPLOYEE_TOKEN_KEY, KIOSK_TOKEN_KEY, TokenService, decodeJwt } from './token.service';

const future = Math.floor(Date.now() / 1000) + 3600;
const past = Math.floor(Date.now() / 1000) - 10;

describe('TokenService', () => {
  beforeEach(() => localStorage.clear());

  it('decodifica el payload base64url del JWT (con acentos)', () => {
    const t = fakeJwt({ scope: 'employee', identityId: 'id-1', name: 'Begoña' });
    expect(decodeJwt<{ identityId: string; name: string }>(t)).toEqual(expect.objectContaining({ identityId: 'id-1', name: 'Begoña' }));
    expect(decodeJwt('basura')).toBeNull();
    expect(decodeJwt(null)).toBeNull();
  });

  it('sesión de empleado: vigencia y patrón elegido', () => {
    const svc = TestBed.inject(TokenService);
    expect(svc.isEmployeeAuthenticated()).toBe(false);
    svc.setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', exp: future }));
    expect(svc.isEmployeeAuthenticated()).toBe(true);
    expect(svc.hasEmployment()).toBe(false);
    svc.setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', accountId: 'a', employmentId: 'e', exp: future }));
    expect(svc.hasEmployment()).toBe(true);
    expect(localStorage.getItem(EMPLOYEE_TOKEN_KEY)).toContain('.');
  });

  it('token vencido o de otro alcance no cuenta como sesión', () => {
    const svc = TestBed.inject(TokenService);
    svc.setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', exp: past }));
    expect(svc.isEmployeeAuthenticated()).toBe(false);
    svc.setEmployeeToken(fakeJwt({ scope: 'kiosk', deviceId: 'd', exp: future }));
    expect(svc.isEmployeeAuthenticated()).toBe(false);
  });

  it('cerrar sesión limpia token y datos de login; el kiosco es independiente', () => {
    const svc = TestBed.inject(TokenService);
    svc.setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', exp: future }));
    svc.setLoginInfo({ firstName: 'Ana', employments: [] });
    svc.setKioskToken(fakeJwt({ scope: 'kiosk', deviceId: 'd', accountId: 'a', locationId: null, exp: future }));
    svc.clearEmployee();
    expect(svc.employeeToken()).toBeNull();
    expect(svc.loginInfo()).toBeNull();
    expect(svc.isKioskActivated()).toBe(true);
    expect(localStorage.getItem(KIOSK_TOKEN_KEY)).not.toBeNull();
  });

  it('lee el token guardado al iniciar', () => {
    localStorage.setItem(EMPLOYEE_TOKEN_KEY, fakeJwt({ scope: 'employee', identityId: 'x', exp: future }));
    const svc = TestBed.inject(TokenService);
    expect(svc.employeeClaims()?.identityId).toBe('x');
  });
});

describe('authInterceptor y guards', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let tokens: TokenService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    tokens.setEmployeeToken('emp.tok.en');
    tokens.setKioskToken('kio.tok.en');
  });

  afterEach(() => mock.verify());

  it('pone el Bearer del empleado en /me y el del kiosco en /kiosk', () => {
    http.get(`${API_URL}/me/status`).subscribe();
    http.get(`${API_URL}/kiosk/qr`).subscribe();
    expect(mock.expectOne(`${API_URL}/me/status`).request.headers.get('Authorization')).toBe('Bearer emp.tok.en');
    expect(mock.expectOne(`${API_URL}/kiosk/qr`).request.headers.get('Authorization')).toBe('Bearer kio.tok.en');
  });

  it('no manda token a rutas públicas ni a otros dominios', () => {
    http.post(`${API_URL}/employee-auth/verify`, {}).subscribe();
    http.get(`${API_URL}/join/abc`).subscribe();
    http.get('https://otro.example/x').subscribe();
    expect(mock.expectOne(`${API_URL}/employee-auth/verify`).request.headers.has('Authorization')).toBe(false);
    expect(mock.expectOne(`${API_URL}/join/abc`).request.headers.has('Authorization')).toBe(false);
    expect(mock.expectOne('https://otro.example/x').request.headers.has('Authorization')).toBe(false);
  });

  it('401 del empleado → borra la sesión y manda a /entrar', () => {
    http.get(`${API_URL}/me/status`).subscribe({ error: () => undefined });
    mock.expectOne(`${API_URL}/me/status`).flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(tokens.employeeToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/entrar'], { queryParams: { expirada: 1 } });
  });

  it('401 en /kiosk/punches (PIN incorrecto) NO desactiva el kiosco; en /kiosk/qr sí', () => {
    http.post(`${API_URL}/kiosk/punches`, {}).subscribe({ error: () => undefined });
    mock.expectOne(`${API_URL}/kiosk/punches`).flush({ message: 'PIN incorrecto' }, { status: 401, statusText: 'Unauthorized' });
    expect(tokens.kioskToken()).toBe('kio.tok.en');
    http.get(`${API_URL}/kiosk/qr`).subscribe({ error: () => undefined });
    mock.expectOne(`${API_URL}/kiosk/qr`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(tokens.kioskToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/kiosco/activar']);
  });

  it('employmentGuard: sin sesión → /entrar; sin patrón → /cuentas', () => {
    const run = () => TestBed.runInInjectionContext(() => employmentGuard({} as never, {} as never));
    tokens.clearEmployee();
    expect(String(run())).toBe('/entrar');
    tokens.setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', exp: future }));
    expect(String(run())).toBe('/cuentas');
    tokens.setEmployeeToken(fakeJwt({ scope: 'employee', identityId: 'i', accountId: 'a', employmentId: 'e', exp: future }));
    expect(run()).toBe(true);
  });

  it('kioskGuard exige un token de kiosco vigente', () => {
    const run = () => TestBed.runInInjectionContext(() => kioskGuard({} as never, {} as never));
    expect(String(run())).toBe('/kiosco/activar');
    tokens.setKioskToken(fakeJwt({ scope: 'kiosk', deviceId: 'd', accountId: 'a', locationId: null, exp: future }));
    expect(run()).toBe(true);
  });
});
