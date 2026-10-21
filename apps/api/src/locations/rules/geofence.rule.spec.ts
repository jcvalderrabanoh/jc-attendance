import { GeofenceKindEnum, Location } from '../entities';
import { GeofenceRule } from './geofence.rule';

const base = (over: Partial<Location> = {}): Location =>
  ({
    id: 'loc-1',
    geofenceKind: GeofenceKindEnum.Circle,
    lat: 19.4326,
    lng: -99.1332,
    radiusMeters: 100,
    maxAccuracyMeters: 50,
    polygon: null,
    ...over,
  }) as Location;

describe('GeofenceRule', () => {
  const rule = new GeofenceRule();

  it('dentro del radio no marca banderas', () => {
    const r = rule.evaluate(base(), 19.4327, -99.1333, 10);
    expect(r.inside).toBe(true);
    expect(r.flags).toEqual([]);
  });

  it('fuera del radio marca out_of_geofence y da la distancia', () => {
    const r = rule.evaluate(base(), 19.44, -99.1332, 10);
    expect(r.inside).toBe(false);
    expect(r.flags).toContain('out_of_geofence');
    expect(r.distanceMeters).toBeGreaterThan(700);
  });

  it('baja precisión se marca aunque esté dentro', () => {
    const r = rule.evaluate(base(), 19.4326, -99.1332, 300);
    expect(r.flags).toContain('low_accuracy');
  });

  it('sin ubicación marca no_location', () => {
    expect(rule.evaluate(base(), null, null).flags).toEqual(['no_location']);
  });

  it('sucursal sin geocerca no evalúa', () => {
    expect(rule.evaluate(base({ geofenceKind: GeofenceKindEnum.None }), 1, 1).inside).toBeNull();
  });

  it('elige la sucursal que contiene el punto', () => {
    const far = base({ id: 'far', lat: 20.6597, lng: -103.3496 });
    const best = rule.pickBest([far, base()], 19.4327, -99.1333, 5);
    expect(best?.locationId).toBe('loc-1');
  });
});
