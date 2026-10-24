import { Injectable } from '@nestjs/common';
import { LocationDao } from '../daos';
import { UpsertLocationDto } from '../dtos';
import { GeofenceKindEnum } from '../entities';

@Injectable()
export class LocationChecker {
  constructor(private readonly locationDao: LocationDao) {}

  async validateUpsert(accountId: string, dto: UpsertLocationDto, id?: string): Promise<string[]> {
    const errors: string[] = [];
    const existing = await this.locationDao.findByName(accountId, dto.name);
    if (existing && existing.id !== id) errors.push('Ya existe una sucursal con ese nombre');
    const kind = dto.geofenceKind ?? GeofenceKindEnum.Circle;
    if (kind === GeofenceKindEnum.Circle && (dto.lat == null || dto.lng == null)) {
      errors.push('La geocerca circular necesita latitud y longitud');
    }
    if (kind === GeofenceKindEnum.Polygon && (!dto.polygon || dto.polygon.length < 3)) {
      errors.push('La geocerca de polígono necesita al menos 3 vértices');
    }
    if (dto.polygon?.some((p) => !Array.isArray(p) || p.length !== 2 || p.some((n) => typeof n !== 'number'))) {
      errors.push('Cada vértice del polígono es [lng, lat]');
    }
    if (dto.allowedIpCidrs?.some((c) => !/^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(c))) {
      errors.push('Las restricciones de IP deben ser CIDR IPv4 (ej. 201.10.0.0/24)');
    }
    if (dto.timeZone) {
      try {
        new Intl.DateTimeFormat('es-MX', { timeZone: dto.timeZone });
      } catch {
        errors.push(`Zona horaria inválida: ${dto.timeZone}`);
      }
    }
    return errors;
  }
}
