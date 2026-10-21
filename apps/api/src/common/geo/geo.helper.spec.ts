import { distanceMeters, ipInCidrs, pointInPolygon } from './geo.helper';

describe('geo.helper', () => {
  it('mide la distancia entre dos puntos de la CDMX', () => {
    // Zócalo → Bellas Artes ≈ 1 km
    const d = distanceMeters(19.4326, -99.1332, 19.4352, -99.1412);
    expect(d).toBeGreaterThan(800);
    expect(d).toBeLessThan(1000);
  });

  const square: [number, number][] = [
    [-99.0, 19.0],
    [-98.0, 19.0],
    [-98.0, 20.0],
    [-99.0, 20.0],
  ];

  it.each([
    [19.5, -98.5, true],
    [21, -98.5, false],
    [19.0, -98.5, true], // borde = dentro (ST_Covers)
  ])('punto (%s, %s) dentro del polígono: %s', (lat, lng, expected) => {
    expect(pointInPolygon(lat, lng, square)).toBe(expected);
  });

  it('reconoce IPs dentro de un CIDR', () => {
    expect(ipInCidrs('192.168.1.20', ['192.168.1.0/24'])).toBe(true);
    expect(ipInCidrs('::ffff:10.0.0.5', ['10.0.0.0/8'])).toBe(true);
    expect(ipInCidrs('8.8.8.8', ['10.0.0.0/8'])).toBe(false);
    expect(ipInCidrs(null, ['10.0.0.0/8'])).toBe(false);
  });
});
