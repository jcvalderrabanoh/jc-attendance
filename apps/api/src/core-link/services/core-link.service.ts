import { Injectable } from '@nestjs/common';
import { AttendanceEntitlement } from '../../common';
import { CoreAccount, CoreAccountDao } from '../daos';

/** Datos de la cuenta de jc-core con caché corta (cambian casi nunca). */
@Injectable()
export class CoreLinkService implements AttendanceEntitlement {
  private readonly cache = new Map<string, { value: CoreAccount | null; until: number }>();

  constructor(private readonly coreAccountDao: CoreAccountDao) {}

  async getAccount(accountId: string): Promise<CoreAccount | null> {
    const hit = this.cache.get(accountId);
    if (hit && hit.until > Date.now()) return hit.value;
    const value = await this.coreAccountDao.findAccount(accountId);
    this.cache.set(accountId, { value, until: Date.now() + 60_000 });
    return value;
  }

  private readonly appCache = new Map<string, { value: boolean; until: number }>();

  async hasAttendanceApp(accountId: string): Promise<boolean> {
    const hit = this.appCache.get(accountId);
    if (hit && hit.until > Date.now()) return hit.value;
    const value = await this.coreAccountDao.hasAttendanceApp(accountId);
    this.appCache.set(accountId, { value, until: Date.now() + 60_000 });
    return value;
  }

  listAccountUsers(accountId: string, search?: string) {
    return this.coreAccountDao.listAccountUsers(accountId, search);
  }

  attendanceAccountsForEmail(email: string) {
    return this.coreAccountDao.findAttendanceAccountsForEmail(email);
  }

  findUsers(accountId: string, userIds: string[]) {
    return this.coreAccountDao.findUsers(accountId, userIds);
  }
}
