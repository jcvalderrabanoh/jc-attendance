import { Injectable } from '@angular/core';

export interface GeoFix {
  lat: number;
  lng: number;
  accuracyMeters: number;
}

export type GeoResult = { ok: true; fix: GeoFix } | { ok: false; reason: 'unsupported' | 'denied' | 'timeout' | 'unavailable' };

/**
 * Una sola lectura de GPS al momento de checar. Nunca se rastrea en
 * segundo plano (`watchPosition` no se usa).
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  current(timeoutMs = 10_000): Promise<GeoResult> {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo) return Promise.resolve({ ok: false, reason: 'unsupported' });
    return new Promise((resolve) => {
      geo.getCurrentPosition(
        (pos) => resolve({ ok: true, fix: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyMeters: pos.coords.accuracy } }),
        (err) => resolve({ ok: false, reason: err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable' }),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
      );
    });
  }
}

export function geoReasonText(reason: string): string {
  switch (reason) {
    case 'denied':
      return 'Permiso de ubicación negado en el navegador';
    case 'timeout':
      return 'No se obtuvo la ubicación a tiempo';
    case 'unsupported':
      return 'Este dispositivo no da ubicación';
    default:
      return 'Ubicación no disponible';
  }
}
