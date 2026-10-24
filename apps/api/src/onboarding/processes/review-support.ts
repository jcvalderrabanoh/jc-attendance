import { Injectable } from '@nestjs/common';
import { InvitationDao } from '../daos';
import { Invitation } from '../entities';



/** Lectura de la liga original de una solicitud (aunque ya esté desactivada). */
@Injectable()
export class InvitationDaoLookup {
  constructor(private readonly invitationDao: InvitationDao) {}

  find(accountId: string, id: string): Promise<Invitation | null> {
    return this.invitationDao.findById(accountId, id);
  }
}
