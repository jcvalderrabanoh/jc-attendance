import { Injectable } from '@nestjs/common';
import { distanceMeters, pointInPolygon } from '../../common';
import { GeofenceKindEnum, Location } from '../entities';

export interface GeofenceEvaluation {
  locationId: string;
  inside: boolean | null;
  distanceMeters: number | null;
  /** Banderas de riesgo: out_of_geofence, low_accuracy, no_location. */
  flags: string[];
}

/**
 * Evalúa un punto contra la geocerca de una sucursal. No bloquea: devuelve
 * banderas y el llamador decide según el modo de la cuenta (alertar/bloquear).
 */
@Injectable()
export class GeofenceRule {
  evaluate(location: Location, lat?: number | null, lng?: number | null, accuracy?: number | null): GeofenceEvaluation {
    if (location.geofenceKind === GeofenceKindEnum.None) {
      return { locationId: location.id, inside: null, distanceMeters: null, flags: [] };
    }
    if (lat == null || lng == null) {
      return { locationId: location.id, inside: null, distanceMeters: null, flags: ['no_location'] };
    }
    const flags: string[] = [];
    if (accuracy != null && accuracy > location.maxAccuracyMeters) flags.push('low_accuracy');

    let inside: boolean;
    let distance: number | null = null;
    if (location.geofenceKind === GeofenceKindEnum.Polygon && location.polygon?.length) {
      inside = pointInPolygon(lat, lng, location.polygon);
      if (location.lat != null && location.lng != null) distance = distanceMeters(lat, lng, location.lat, location.lng);
    } else {
      if (location.lat == null || location.lng == null) {
        return { locationId: location.id, inside: null, distanceMeters: null, flags: ['location_without_coordinates'] };
      }
      distance = distanceMeters(lat, lng, location.lat, location.lng);
      // La precisión reportada es un radio al 68 %: se concede como margen, con tope.
      const margin = Math.min(accuracy ?? 0, location.radiusMeters);
      inside = distance <= location.radiusMeters + margin;
    }
    if (!inside) flags.push('out_of_geofence');
    return { locationId: location.id, inside, distanceMeters: distance == null ? null : Math.round(distance), flags };
  }

  /** De varias sucursales permitidas, la que contiene el punto o la más cercana. */
  pickBest(locations: Location[], lat?: number | null, lng?: number | null, accuracy?: number | null): GeofenceEvaluation | null {
    if (locations.length === 0) return null;
    const evaluations = locations.map((l) => this.evaluate(l, lat, lng, accuracy));
    const inside = evaluations.find((e) => e.inside === true);
    if (inside) return inside;
    return evaluations.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity))[0];
  }
}
