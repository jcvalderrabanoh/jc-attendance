const EARTH_RADIUS_M = 6_371_000;

/** Distancia en metros entre dos puntos (haversine). */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/**
 * Punto dentro de polígono (ray casting). `ring` en orden GeoJSON [lng, lat].
 * El borde cuenta como dentro (equivale a ST_Covers, no a ST_Contains).
 */
export function pointInPolygon(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    // Sobre el segmento: dentro.
    const cross = (lng - xi) * (yj - yi) - (lat - yi) * (xj - xi);
    if (Math.abs(cross) < 1e-12 && lng >= Math.min(xi, xj) && lng <= Math.max(xi, xj) && lat >= Math.min(yi, yj) && lat <= Math.max(yi, yj)) {
      return true;
    }
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** ¿Está la IP dentro de alguno de los CIDR IPv4? */
export function ipInCidrs(ip: string | null | undefined, cidrs: string[]): boolean {
  if (!ip || cidrs.length === 0) return false;
  const clean = ip.replace(/^::ffff:/, '');
  const toInt = (v: string) => v.split('.').reduce((acc, oct) => (acc << 8) + (parseInt(oct, 10) & 255), 0) >>> 0;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(clean)) return false;
  const value = toInt(clean);
  return cidrs.some((cidr) => {
    const [base, bitsRaw] = cidr.split('/');
    const bits = bitsRaw === undefined ? 32 : parseInt(bitsRaw, 10);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (toInt(base) & mask) === (value & mask);
  });
}
