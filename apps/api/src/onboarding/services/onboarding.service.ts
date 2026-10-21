import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizePhoneE164 } from '@jc-attendance/rules-engine';
import * as QRCode from 'qrcode';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, CoreUserContext, EmployeeContext, found, unwrap, unwrapProcess } from '../../common';
import { CustomFieldEntityEnum } from '../../custom-fields/entities';
import { CustomFieldsService } from '../../custom-fields/services';
import { OtpChannelEnum } from '../../employee-auth/entities';
import { RequestOtpProcess } from '../../employee-auth/processes';
import { EmployeeIdentityDao } from '../../employees';
import { AccountSettingsDao } from '../../organization/daos';
import { ResubmitOnboardingBluePrint, ReviewAction, ReviewOnboardingBluePrint, SubmitOnboardingBluePrint } from '../blueprints';
import { InvitationChecker } from '../checkers';
import { InvitationDao, OnboardingRequestDao, OnboardingRuleDao } from '../daos';
import { ListOnboardingQueryDto, ResubmitOnboardingDto, ReviewDecisionDto, SubmitOnboardingDto, UpdateOnboardingRuleDto, UpsertInvitationDto } from '../dtos';
import { Invitation } from '../entities';
import { CheckInvitationProcess, CreateInvitationTokenProcess } from '../processes';
import { ONBOARDING_RULES, ONBOARDING_RULES_BY_KEY, OnboardingRulesEvaluator } from '../rules';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly invitationDao: InvitationDao,
    private readonly requestDao: OnboardingRequestDao,
    private readonly ruleDao: OnboardingRuleDao,
    private readonly invitationChecker: InvitationChecker,
    private readonly createToken: CreateInvitationTokenProcess,
    private readonly checkInvitation: CheckInvitationProcess,
    private readonly submitBluePrint: SubmitOnboardingBluePrint,
    private readonly reviewBluePrint: ReviewOnboardingBluePrint,
    private readonly resubmitBluePrint: ResubmitOnboardingBluePrint,
    private readonly evaluator: OnboardingRulesEvaluator,
    private readonly requestOtp: RequestOtpProcess,
    private readonly customFields: CustomFieldsService,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly audit: RecordAuditProcess,
  ) {}

  // ── Ligas ───────────────────────────────────────────────────────────────

  listInvitations(accountId: string) {
    return this.invitationDao.findAll(accountId, {}, { createdAt: 'DESC' });
  }

  /** Crea la liga. El token en claro solo viaja en esta respuesta. */
  async createInvitation(accountId: string, dto: UpsertInvitationDto, actor: CoreUserContext) {
    const errors = await this.invitationChecker.validate(accountId, dto);
    if (errors.length) throw new BadRequestException(errors.join('; '));
    const { token, tokenHash, url } = this.createToken.process();
    const invitation = await this.invitationDao.create({
      ...this.invitationData(dto),
      accountId,
      tokenHash,
      createdByUserId: actor.userId,
    });
    await this.audit.process({ accountId, actor, entity: 'invitation', entityId: invitation.id, action: 'create', after: invitation });
    return { ...invitation, token, url, qrDataUrl: await QRCode.toDataURL(url, { margin: 1, width: 360 }) };
  }

  async updateInvitation(accountId: string, id: string, dto: UpsertInvitationDto, actor: AuthContext) {
    const errors = await this.invitationChecker.validate(accountId, dto);
    if (errors.length) throw new BadRequestException(errors.join('; '));
    const saved = found(await this.invitationDao.update(accountId, id, this.invitationData(dto)), 'La liga no existe');
    await this.audit.process({ accountId, actor, entity: 'invitation', entityId: id, action: 'update', after: saved });
    return saved;
  }

  /** Nuevo token (la liga anterior deja de funcionar). */
  async regenerateInvitation(accountId: string, id: string, actor: AuthContext) {
    found(await this.invitationDao.findById(accountId, id), 'La liga no existe');
    const { token, tokenHash, url } = this.createToken.process();
    const saved = await this.invitationDao.update(accountId, id, { tokenHash });
    await this.audit.process({ accountId, actor, entity: 'invitation', entityId: id, action: 'regenerate' });
    return { ...saved, token, url, qrDataUrl: await QRCode.toDataURL(url, { margin: 1, width: 360 }) };
  }

  async removeInvitation(accountId: string, id: string, actor: AuthContext) {
    const deleted = await this.invitationDao.softDelete(accountId, id);
    if (deleted) await this.audit.process({ accountId, actor, entity: 'invitation', entityId: id, action: 'delete' });
    return { deleted };
  }

  private invitationData(dto: UpsertInvitationDto): Partial<Invitation> {
    return {
      name: dto.name.trim(),
      kind: dto.kind,
      targetPhone: dto.targetPhone ? normalizePhoneE164(dto.targetPhone) : null,
      targetEmail: dto.targetEmail?.toLowerCase() ?? null,
      defaultDepartmentId: dto.defaultDepartmentId ?? null,
      defaultPositionId: dto.defaultPositionId ?? null,
      defaultLocationId: dto.defaultLocationId ?? null,
      defaultScheduleId: dto.defaultScheduleId ?? null,
      maxUses: dto.maxUses ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      requireApproval: dto.requireApproval ?? true,
      allowedEmailDomains: dto.allowedEmailDomains ?? [],
      requiredFields: dto.requiredFields ?? [],
    };
  }

  // ── Reglas ──────────────────────────────────────────────────────────────

  async listRules(accountId: string) {
    const effective = this.evaluator.effectiveRules(await this.ruleDao.findAll(accountId));
    return effective.map((r) => ({ ...ONBOARDING_RULES_BY_KEY.get(r.ruleKey), ...r }));
  }

  async updateRule(accountId: string, ruleKey: string, dto: UpdateOnboardingRuleDto, actor: AuthContext) {
    const def = ONBOARDING_RULES_BY_KEY.get(ruleKey);
    if (!def) throw new BadRequestException(`Regla desconocida. Disponibles: ${ONBOARDING_RULES.map((r) => r.ruleKey).join(', ')}`);
    if (def.fixed && (dto.enabled === false || dto.severity)) throw new BadRequestException('Esta regla es obligatoria y no se puede cambiar');
    if (ruleKey === 'custom_regex' && dto.config?.regex) {
      try {
        new RegExp(String(dto.config.regex));
      } catch {
        throw new BadRequestException('La expresión regular no es válida');
      }
    }
    const current = (await this.listRules(accountId)).find((r) => r.ruleKey === ruleKey)!;
    await this.ruleDao.upsert(accountId, ruleKey, {
      enabled: dto.enabled ?? current.enabled,
      severity: dto.severity ?? current.severity,
      config: { ...current.config, ...(dto.config ?? {}) },
    });
    await this.audit.process({ accountId, actor, entity: 'onboarding_rule', action: 'update', after: { ruleKey, ...dto } });
    return this.listRules(accountId);
  }

  // ── Cola de validación ──────────────────────────────────────────────────

  async listRequests(accountId: string, query: ListOnboardingQueryDto) {
    const page = await this.requestDao.findPage(accountId, query.status ? { reviewStatus: query.status } : {}, query.page, query.limit);
    return { ...page, pendingCount: await this.requestDao.countPending(accountId) };
  }

  async getRequest(accountId: string, id: string) {
    const request = found(await this.requestDao.findById(accountId, id), 'La solicitud no existe');
    const identity = request.identityId ? await this.identityDao.findById(request.identityId) : null;
    const invitation = await this.invitationDao.findById(accountId, request.invitationId);
    return { ...request, identity, invitation: invitation && { id: invitation.id, name: invitation.name } };
  }

  async review(accountId: string, id: string, action: ReviewAction, dto: ReviewDecisionDto, actor: CoreUserContext) {
    unwrap(await this.reviewBluePrint.execute({ accountId, requestId: id, action, dto, actor }));
    return this.getRequest(accountId, id);
  }

  // ── Público (PWA) ───────────────────────────────────────────────────────

  /** Lo que el formulario de alta necesita mostrar. */
  async joinInfo(token: string) {
    const invitation = unwrapProcess(await this.checkInvitation.process(token));
    const settings = await this.accountSettingsDao.findByAccount(invitation.accountId);
    const fields = await this.customFields.list(invitation.accountId, CustomFieldEntityEnum.Employment);
    return {
      accountName: settings?.displayName ?? 'Tu empresa',
      branding: settings?.branding ?? {},
      invitationName: invitation.name,
      personal: Boolean(invitation.targetPhone || invitation.targetEmail),
      requiredFields: invitation.requiredFields,
      allowedEmailDomains: invitation.allowedEmailDomains,
      privacyNoticeUrl: settings?.privacyNoticeUrl ?? null,
      privacyNoticeVersion: settings?.privacyNoticeVersion ?? '1',
      customFields: fields
        .filter((f) => f.askOnOnboarding)
        .map((f) => ({ key: f.key, label: f.label, type: f.type, options: f.options, required: f.required, validation: f.validation })),
    };
  }

  async joinOtp(token: string, phone: string, ip: string | null) {
    unwrapProcess(await this.checkInvitation.process(token));
    return unwrapProcess(await this.requestOtp.process(phone, OtpChannelEnum.Whatsapp, ip));
  }

  async submit(token: string, dto: SubmitOnboardingDto, ip: string | null, userAgent: string | null) {
    return unwrap(await this.submitBluePrint.execute({ token, dto, ip, userAgent }));
  }

  /** El empleado consulta sus solicitudes de alta (en cualquier cuenta). */
  async myRequests(employee: EmployeeContext) {
    const rows = await this.requestDao.findAllForIdentity(employee.identityId);
    return Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        accountId: r.accountId,
        accountName: (await this.accountSettingsDao.findByAccount(r.accountId))?.displayName ?? 'Empresa',
        reviewStatus: r.reviewStatus,
        reviewComment: r.reviewComment,
        createdAt: r.createdAt,
        findings: r.validationResults.filter((x) => x.outcome !== 'pass'),
      })),
    );
  }

  async resubmit(employee: EmployeeContext, requestId: string, dto: ResubmitOnboardingDto) {
    return unwrap(await this.resubmitBluePrint.execute({ requestId, identityId: employee.identityId, dto, actor: employee }));
  }
}
