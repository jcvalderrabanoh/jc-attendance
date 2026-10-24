import { HttpTestingController, TestRequest } from '@angular/common/http/testing';

/** Espera (con timers reales) a que aparezca una petición; útil cuando antes hay IndexedDB. */
export async function waitForRequest(http: HttpTestingController, match: (url: string) => boolean, timeoutMs = 2000): Promise<TestRequest> {
  const started = Date.now();
  for (;;) {
    const found = http.match((r) => match(r.urlWithParams));
    if (found.length) return found[0];
    if (Date.now() - started > timeoutMs) throw new Error('No llegó la petición esperada');
    await new Promise((r) => setTimeout(r, 5));
  }
}

/** Token JWT falso (firma irrelevante: el cliente no la valida). */
export function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.firma`;
}

export const flushMicrotasks = () => new Promise((r) => setTimeout(r, 0));
