import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusForEntityEnum, TenantDao } from '../../common';
import { Invitation, OnboardingRequest, OnboardingRule, ReviewStatusEnum } from '../entities';

@Injectable()
export class InvitationDao extends TenantDao<Invitation> {
  constructor(@InjectRepository(Invitation) repository: Repository<Invitation>) {
    super(repository);
  }

  findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    return this.repository.findOne({ where: { tokenHash, status: StatusForEntityEnum.Active } });
  }

  /** Canje atómico: solo suma si quedan usos (dos altas simultáneas no pasan el tope). */
  async redeem(id: string): Promise<boolean> {
    const rows = await this.repository.query(
      `UPDATE "attendance"."invitations" SET "usesCount" = "usesCount" + 1
        WHERE "id" = $1 AND "status" = 'active' AND ("maxUses" IS NULL OR "usesCount" < "maxUses")
          AND ("expiresAt" IS NULL OR "expiresAt" > now())
        RETURNING "id"`,
      [id],
    );
    return rows.length > 0;
  }
}

@Injectable()
export class OnboardingRequestDao extends TenantDao<OnboardingRequest> {
  constructor(@InjectRepository(OnboardingRequest) repository: Repository<OnboardingRequest>) {
    super(repository);
  }

  findOpenForIdentity(accountId: string, identityId: string): Promise<OnboardingRequest | null> {
    return this.repository
      .createQueryBuilder('r')
      .where('r.accountId = :accountId AND r.identityId = :identityId AND r.reviewStatus IN (:...open)', {
        accountId,
        identityId,
        open: [ReviewStatusEnum.Pending, ReviewStatusEnum.NeedsInfo],
      })
      .orderBy('r.createdAt', 'DESC')
      .getOne();
  }

  /** Para el empleado: sus solicitudes en cualquier cuenta. */
  findByIdForIdentity(id: string, identityId: string): Promise<OnboardingRequest | null> {
    return this.repository.findOne({ where: { id, identityId } });
  }

  findAllForIdentity(identityId: string): Promise<OnboardingRequest[]> {
    return this.repository.find({ where: { identityId }, order: { createdAt: 'DESC' } });
  }

  countPending(accountId: string): Promise<number> {
    return this.repository.count({ where: { accountId, reviewStatus: ReviewStatusEnum.Pending } });
  }
}

@Injectable()
export class OnboardingRuleDao extends TenantDao<OnboardingRule> {
  constructor(@InjectRepository(OnboardingRule) repository: Repository<OnboardingRule>) {
    super(repository);
  }

  async upsert(accountId: string, ruleKey: string, data: Partial<OnboardingRule>): Promise<OnboardingRule> {
    const current = await this.repository.findOne({ where: { accountId, ruleKey, ...this.notDeleted() } });
    const entity = current ? this.repository.merge(current, data) : this.repository.create({ ...data, accountId, ruleKey });
    return this.repository.save(entity);
  }
}
