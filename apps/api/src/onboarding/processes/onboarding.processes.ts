import { Injectable } from '@nestjs/common';
import { hashSecret, ProcessInterfaceResult, randomToken } from '../../common';
import { EmployeeIdentityDao, EmploymentDao, IdentityDataRule, NormalizedIdentity } from '../../employees';
import { InvitationDao, OnboardingRuleDao } from '../daos';
import { Invitation } from '../entities';
import { EffectiveRule, OnboardingFacts, OnboardingRulesEvaluator } from '../rules';

export function invitationTokenHash(token: string): string {
  return hashSecret(`invitation:${token}`);
}

export function joinUrl(token: string): string {
  return `${(process.env.PUBLIC_APP_URL || 'http://localhost:4300').replace(/\/$/, '')}/unirse/${token}`;
}

/** Genera el token de la liga (se devuelve una sola vez) y guarda su hash. */
@Injectable()
export class CreateInvitationTokenProcess {
  process(): { token: string; tokenHash: string; url: string } {
    const token = randomToken(18);
    return { token, tokenHash: invitationTokenHash(token), url: joinUrl(token) };
  }
}

/** Valida la vigencia de una liga sin consumirla. */
@Injectable()
export class CheckInvitationProcess {
  constructor(private readonly invitationDao: InvitationDao) {}

  async process(token: string): Promise<ProcessInterfaceResult<Invitation>> {
    const invitation = await this.invitationDao.findByTokenHash(invitationTokenHash(token));
    if (!invitation) return { success: false, error: 'La liga no existe o fue desactivada' };
    if (invitation.expiresAt && invitation.expiresAt < new Date()) return { success: false, error: 'La liga venció; pide una nueva a tu empresa' };
    if (invitation.maxUses != null && invitation.usesCount >= invitation.maxUses) return { success: false, error: 'La liga ya alcanzó su límite de registros' };
    return { success: true, data: invitation };
  }
}

/** Reúne de la BD los hechos que evalúan las reglas de alta. */
@Injectable()
export class GatherOnboardingFactsProcess {
  constructor(
    private readonly identityDao: EmployeeIdentityDao,
    private readonly employmentDao: EmploymentDao,
    private readonly identityRule: IdentityDataRule,
    private readonly ruleDao: OnboardingRuleDao,
    private readonly evaluator: OnboardingRulesEvaluator,
  ) {}

  async rulesFor(accountId: string): Promise<EffectiveRule[]> {
    return this.evaluator.effectiveRules(await this.ruleDao.findAll(accountId));
  }

  async process(input: {
    accountId: string;
    invitation: Invitation | null;
    identity: NormalizedIdentity;
    /** Identidad propia (reenvío): no cuenta como duplicado de sí misma. */
    selfIdentityId?: string | null;
    customFields: Record<string, unknown>;
    customFieldErrors: string[];
    formatErrors: string[];
    privacyAccepted: boolean;
    phoneVerified: boolean;
  }): Promise<OnboardingFacts> {
    const { accountId, identity } = input;
    const duplicates: string[] = [];
    let existsInOtherAccounts = false;
    const check = async (label: string, found: { id: string } | null) => {
      if (!found || found.id === input.selfIdentityId) return;
      const employments = await this.employmentDao.findAllForIdentity(found.id);
      if (employments.some((e) => e.accountId === accountId)) duplicates.push(label);
      else if (employments.length) existsInOtherAccounts = true;
    };
    if (identity.phoneE164) await check('teléfono', await this.identityDao.findByPhone(identity.phoneE164));
    if (identity.email) await check('email', await this.identityDao.findByEmail(identity.email));
    if (identity.curp) for (const other of await this.identityDao.findByCurp(identity.curp)) await check('CURP', other);

    return {
      invitationValid: true,
      phoneVerified: input.phoneVerified,
      identity,
      requiredFields: input.invitation?.requiredFields ?? [],
      allowedEmailDomains: input.invitation?.allowedEmailDomains ?? [],
      customFieldErrors: [...input.customFieldErrors, ...input.formatErrors.filter((e) => !/CURP|RFC|NSS/.test(e))],
      customFields: input.customFields,
      privacyAccepted: input.privacyAccepted,
      duplicatesInAccount: [...new Set(duplicates)],
      existsInOtherAccounts,
      ageYears: this.identityRule.ageOn(identity.birthDate),
    };
  }
}
