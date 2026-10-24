import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Consent, ConsentKindEnum, OtpChallenge } from '../entities';

@Injectable()
export class OtpChallengeDao {
  constructor(@InjectRepository(OtpChallenge) private readonly repository: Repository<OtpChallenge>) {}

  create(data: Partial<OtpChallenge>): Promise<OtpChallenge> {
    return this.repository.save(this.repository.create(data));
  }

  /** Último desafío vigente y sin usar para ese destino. */
  findActive(destination: string): Promise<OtpChallenge | null> {
    return this.repository.findOne({
      where: { destination, consumedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
  }

  countSince(destination: string, since: Date): Promise<number> {
    return this.repository.count({ where: { destination, createdAt: MoreThan(since) } });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.repository.increment({ id }, 'attempts', 1);
  }

  async consume(id: string): Promise<void> {
    await this.repository.update({ id }, { consumedAt: new Date() });
  }
}

@Injectable()
export class ConsentDao {
  constructor(@InjectRepository(Consent) private readonly repository: Repository<Consent>) {}

  create(data: Partial<Consent>): Promise<Consent> {
    return this.repository.save(this.repository.create(data));
  }

  findActive(identityId: string, accountId: string): Promise<Consent[]> {
    return this.repository.find({ where: { identityId, accountId, revokedAt: IsNull() }, order: { grantedAt: 'DESC' } });
  }

  async revoke(identityId: string, accountId: string, kind: ConsentKindEnum): Promise<number> {
    const result = await this.repository.update({ identityId, accountId, kind, revokedAt: IsNull() }, { revokedAt: new Date() });
    return result.affected ?? 0;
  }
}
