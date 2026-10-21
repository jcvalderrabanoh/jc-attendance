import { Injectable } from '@nestjs/common';
import { curpBirthDate, isValidCurp, isValidNss, isValidRfc, normalizePhoneE164 } from '@jc-attendance/rules-engine';
import { IdentityDataDto } from '../dtos';

export interface NormalizedIdentity {
  firstName?: string;
  lastName?: string;
  phoneE164?: string | null;
  email?: string | null;
  curp?: string | null;
  rfc?: string | null;
  nss?: string | null;
  birthDate?: string | null;
}

/** Normaliza y valida formato de los datos de identidad (CURP, RFC, NSS, teléfono). */
@Injectable()
export class IdentityDataRule {
  normalize(data: Partial<IdentityDataDto>): { value: NormalizedIdentity; errors: string[] } {
    const errors: string[] = [];
    const value: NormalizedIdentity = {};
    if (data.firstName !== undefined) value.firstName = data.firstName.trim();
    if (data.lastName !== undefined) value.lastName = data.lastName.trim();
    if (data.phone !== undefined) {
      const phone = data.phone ? normalizePhoneE164(data.phone) : null;
      if (data.phone && !phone) errors.push('Teléfono inválido (10 dígitos)');
      value.phoneE164 = phone;
    }
    if (data.email !== undefined) value.email = data.email ? data.email.trim().toLowerCase() : null;
    if (data.curp) {
      const curp = data.curp.trim().toUpperCase();
      if (!isValidCurp(curp)) errors.push('CURP inválida');
      value.curp = curp;
      value.birthDate = data.birthDate ?? curpBirthDate(curp);
    } else if (data.birthDate !== undefined) {
      value.birthDate = data.birthDate || null;
    }
    if (data.rfc) {
      const rfc = data.rfc.trim().toUpperCase();
      if (!isValidRfc(rfc)) errors.push('RFC inválido');
      value.rfc = rfc;
    }
    if (data.nss) {
      const nss = data.nss.trim();
      if (!isValidNss(nss)) errors.push('NSS inválido');
      value.nss = nss;
    }
    return { value, errors };
  }

  /** Edad cumplida a una fecha (para menores de 18). */
  ageOn(birthDate: string | null | undefined, on: Date = new Date()): number | null {
    if (!birthDate) return null;
    const [y, m, d] = birthDate.split('-').map(Number);
    let age = on.getUTCFullYear() - y;
    if (on.getUTCMonth() + 1 < m || (on.getUTCMonth() + 1 === m && on.getUTCDate() < d)) age -= 1;
    return age;
  }
}
