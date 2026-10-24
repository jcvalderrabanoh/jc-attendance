import { Injectable } from '@nestjs/common';
import { ProcessInterfaceResult } from '../../common';
import { EmployeeIdentityDao } from '../daos';
import { EmployeeIdentity } from '../entities';
import { NormalizedIdentity } from '../rules';

export interface ResolvedIdentity {
  identity: EmployeeIdentity;
  /** true si la persona ya existía (p. ej. trabaja para otro patrón). */
  existed: boolean;
}

/**
 * Encuentra a la persona por teléfono o email (identidad global, multicuenta)
 * o la crea. Si existe, solo completa datos vacíos: nunca sobrescribe lo que
 * capturó otro patrón.
 */
@Injectable()
export class ResolveIdentityProcess {
  constructor(private readonly identityDao: EmployeeIdentityDao) {}

  async process(data: NormalizedIdentity, verified: { phone?: boolean; email?: boolean } = {}): Promise<ProcessInterfaceResult<ResolvedIdentity>> {
    if (!data.phoneE164 && !data.email) {
      return { success: false, error: 'Se necesita teléfono o email para identificar a la persona' };
    }
    const byPhone = data.phoneE164 ? await this.identityDao.findByPhone(data.phoneE164) : null;
    const byEmail = data.email ? await this.identityDao.findByEmail(data.email) : null;
    if (byPhone && byEmail && byPhone.id !== byEmail.id) {
      return { success: false, error: 'El teléfono y el email pertenecen a personas distintas' };
    }
    const existing = byPhone ?? byEmail;
    const now = new Date();
    if (existing) {
      const patch: Partial<EmployeeIdentity> = {};
      for (const key of ['email', 'phoneE164', 'curp', 'rfc', 'nss', 'birthDate'] as const) {
        if (!existing[key] && data[key]) (patch as Record<string, unknown>)[key] = data[key];
      }
      if (verified.phone && !existing.phoneVerifiedAt) patch.phoneVerifiedAt = now;
      if (verified.email && !existing.emailVerifiedAt) patch.emailVerifiedAt = now;
      const identity = Object.keys(patch).length ? await this.identityDao.update(existing.id, patch) : existing;
      return { success: true, data: { identity: identity!, existed: true } };
    }
    const identity = await this.identityDao.create({
      firstName: data.firstName!,
      lastName: data.lastName!,
      phoneE164: data.phoneE164 ?? null,
      email: data.email ?? null,
      curp: data.curp ?? null,
      rfc: data.rfc ?? null,
      nss: data.nss ?? null,
      birthDate: data.birthDate ?? null,
      phoneVerifiedAt: verified.phone ? now : null,
      emailVerifiedAt: verified.email ? now : null,
    });
    return { success: true, data: { identity, existed: false } };
  }
}
