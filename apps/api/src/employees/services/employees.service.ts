import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordAuditProcess } from '../../audit/processes';
import { AuthContext, EmployeeContext, found, hashSecret, unwrap } from '../../common';
import { CustomFieldEntityEnum } from '../../custom-fields/entities';
import { CustomFieldsService } from '../../custom-fields/services';
import { AccountSettingsDao } from '../../organization/daos';
import { CreateEmployeeBluePrint, TerminateEmployeeBluePrint, UpdateEmployeeBluePrint } from '../blueprints';
import { EmployeeIdentityDao, EmploymentDao } from '../daos';
import { CreateEmployeeDto, ListEmployeesQueryDto, TerminateEmployeeDto, UpdateEmployeeDto, UpdateMyProfileDto } from '../dtos';
import { Employment } from '../entities';
import { ImportEmployeesProcess } from '../processes';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly createBluePrint: CreateEmployeeBluePrint,
    private readonly updateBluePrint: UpdateEmployeeBluePrint,
    private readonly terminateBluePrint: TerminateEmployeeBluePrint,
    private readonly employmentDao: EmploymentDao,
    private readonly identityDao: EmployeeIdentityDao,
    private readonly accountSettingsDao: AccountSettingsDao,
    private readonly customFields: CustomFieldsService,
    private readonly audit: RecordAuditProcess,
    private readonly importProcess: ImportEmployeesProcess,
  ) {}

  /** Plantilla de importación con las columnas base y los campos personalizados de la cuenta. */
  async importTemplate(accountId: string) {
    return this.importProcess.template(await this.customFields.list(accountId, CustomFieldEntityEnum.Employment));
  }

  /**
   * Importación masiva. `dryRun` = vista previa: valida cada fila con las
   * mismas reglas del alta manual sin guardar nada.
   */
  async import(accountId: string, file: { buffer: Buffer; originalname: string }, dryRun: boolean, actor: AuthContext) {
    const fields = await this.customFields.list(accountId, CustomFieldEntityEnum.Employment);
    const rows = await this.importProcess.parse(accountId, file.buffer, file.originalname, fields);
    if (rows.length > 1000) throw new BadRequestException('Máximo 1,000 filas por archivo');
    const results: { row: number; ok: boolean; errors: string[]; employmentId?: string }[] = [];
    for (const r of rows) {
      if (!r.dto) {
        results.push({ row: r.row, ok: false, errors: r.errors });
        continue;
      }
      if (dryRun) {
        const cf = await this.customFields.validateValues(accountId, CustomFieldEntityEnum.Employment, r.dto.customFields);
        results.push({ row: r.row, ok: cf.errors.length === 0, errors: cf.errors });
        continue;
      }
      const created = await this.createBluePrint.execute({ accountId, dto: r.dto, actor });
      results.push({ row: r.row, ok: created.isValid, errors: created.constraints.map((c) => c.error ?? ''), employmentId: created.data?.id });
    }
    if (!dryRun) await this.audit.process({ accountId, actor, entity: 'employment', action: 'import', after: { file: file.originalname, rows: rows.length, created: results.filter((r) => r.ok).length } });
    return { dryRun, total: results.length, ok: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results };
  }

  list(accountId: string, query: ListEmployeesQueryDto) {
    let customFields: Record<string, unknown> | undefined;
    if (query.customFields) {
      try {
        customFields = JSON.parse(query.customFields);
      } catch {
        throw new BadRequestException('customFields debe ser JSON');
      }
    }
    return this.employmentDao.list(accountId, { ...query, customFields });
  }

  async get(accountId: string, employmentId: string) {
    const employment = found(await this.employmentDao.findById(accountId, employmentId), 'El empleado no existe');
    const identity = await this.identityDao.findById(employment.identityId);
    return { ...employment, identity };
  }

  async create(accountId: string, dto: CreateEmployeeDto, actor: AuthContext) {
    const employment = unwrap(await this.createBluePrint.execute({ accountId, dto, actor }));
    return this.get(accountId, employment.id);
  }

  async update(accountId: string, employmentId: string, dto: UpdateEmployeeDto, actor: AuthContext) {
    unwrap(await this.updateBluePrint.execute({ accountId, employmentId, dto, actor }));
    return this.get(accountId, employmentId);
  }

  async terminate(accountId: string, employmentId: string, dto: TerminateEmployeeDto, actor: AuthContext) {
    return unwrap(await this.terminateBluePrint.execute({ accountId, employmentId, dto, actor }));
  }

  async setKioskPin(accountId: string, employmentId: string, pin: string, actor: AuthContext) {
    const employment = found(await this.employmentDao.findById(accountId, employmentId), 'El empleado no existe');
    if (!employment.employeeNumber) throw new BadRequestException('Asigna primero un número de empleado: el kiosco pide número + PIN');
    await this.employmentDao.update(accountId, employmentId, { kioskPinHash: hashSecret(`${accountId}:${pin}`) });
    await this.audit.process({ accountId, actor, entity: 'employment', entityId: employmentId, action: 'set_kiosk_pin' });
    return { ok: true };
  }

  // ── Del lado del empleado ────────────────────────────────────────────────

  /** Patrones para los que trabaja (selector de cuenta del PWA). */
  async myEmployments(identityId: string) {
    const employments = await this.employmentDao.findAllForIdentity(identityId);
    const accounts = await Promise.all(employments.map((e) => this.accountSettingsDao.findByAccount(e.accountId)));
    return employments.map((e, i) => ({
      employmentId: e.id,
      accountId: e.accountId,
      accountName: accounts[i]?.displayName ?? 'Empresa',
      employeeNumber: e.employeeNumber,
      onboardingStatus: e.onboardingStatus,
      defaultLocationId: e.defaultLocationId,
    }));
  }

  async myProfile(employee: EmployeeContext) {
    const identity = found(await this.identityDao.findById(employee.identityId), 'No encontramos tu perfil');
    let employment: Employment | null = null;
    let fields: unknown[] = [];
    if (employee.accountId && employee.employmentId) {
      employment = await this.employmentDao.findById(employee.accountId, employee.employmentId);
      fields = (await this.customFields.list(employee.accountId, CustomFieldEntityEnum.Employment)).filter((f) => f.visibleToEmployee);
    }
    const visibleKeys = new Set((fields as { key: string }[]).map((f) => f.key));
    return {
      identity,
      employment: employment && {
        ...employment,
        // El empleado no ve sueldos ni campos internos.
        hourlyRate: undefined,
        dailySalary: undefined,
        customFields: Object.fromEntries(Object.entries(employment.customFields).filter(([k]) => visibleKeys.has(k))),
      },
      customFieldDefinitions: fields,
    };
  }

  async updateMyProfile(employee: EmployeeContext, dto: UpdateMyProfileDto) {
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const other = await this.identityDao.findByEmail(email);
      if (other && other.id !== employee.identityId) throw new BadRequestException('Ese email ya está registrado por otra persona');
      // Un email nuevo queda sin verificar hasta que entre con él.
      await this.identityDao.update(employee.identityId, { email, emailVerifiedAt: null });
    }
    if (dto.customFields && employee.accountId && employee.employmentId) {
      const employment = found(await this.employmentDao.findById(employee.accountId, employee.employmentId), 'No encontramos tu empleo');
      const cf = await this.customFields.validateValues(employee.accountId, CustomFieldEntityEnum.Employment, dto.customFields, { asEmployee: true, partial: true });
      if (cf.errors.length) throw new BadRequestException(cf.errors.join('; '));
      await this.employmentDao.update(employee.accountId, employment.id, { customFields: { ...employment.customFields, ...cf.values } });
      await this.audit.process({ accountId: employee.accountId, actor: employee, entity: 'employment', entityId: employment.id, action: 'self_update', after: cf.values });
    }
    return this.myProfile(employee);
  }
}
