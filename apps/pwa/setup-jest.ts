import 'fake-indexeddb/auto';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Después de preparar el entorno (necesita el compilador JIT cargado).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerLocaleData } = require('@angular/common') as typeof import('@angular/common');
// eslint-disable-next-line @typescript-eslint/no-require-imports
registerLocaleData((require('@angular/common/locales/es-MX') as { default: unknown }).default);

// jsdom no trae structuredClone en todas las versiones; fake-indexeddb lo necesita.
if (typeof (globalThis as { structuredClone?: unknown }).structuredClone !== 'function') {
  (globalThis as { structuredClone: <T>(v: T) => T }).structuredClone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
}
if (!globalThis.crypto?.randomUUID) {
  let n = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...(globalThis.crypto ?? {}), randomUUID: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}` },
    configurable: true,
  });
}
