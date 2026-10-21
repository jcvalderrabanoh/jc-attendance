import { Injectable } from '@nestjs/common';
import { isValidCurp, isValidNss, isValidRfc } from '@jc-attendance/rules-engine';
import { RuleResult, RuleSeverityEnum } from '../entities';
import { ONBOARDING_RULES } from './onboarding-rules.catalog';

export interface EffectiveRule {
  ruleKey: string;
  enabled: boolean;
  severity: RuleSeverityEnum;
  config: Record<string, unknown>;
}

/** Hechos ya reunidos (DB, OTP, campos) que las reglas evalúan sin consultar nada. */
export interface OnboardingFacts {
  invitationValid: boolean;
  invitationProblem?: string;
  phoneVerified: boolean;
  identity: {
    firstName?: string;
    lastName?: string;
    phoneE164?: string | null;
    email?: string | null;
    curp?: string | null;
    rfc?: string | null;
    nss?: string | null;
    birthDate?: string | null;
  };
  requiredFields: string[];
  allowedEmailDomains: string[];
  customFieldErrors: string[];
  customFields: Record<string, unknown>;
  privacyAccepted: boolean;
  duplicatesInAccount: string[];
  existsInOtherAccounts: boolean;
  ageYears: number | null;
}

export interface OnboardingEvaluation {
  results: RuleResult[];
  blocked: boolean;
  warnings: number;
  riskScore: number;
}

/** Evalúa las reglas activas de la cuenta. Puro: fácil de probar. */
@Injectable()
export class OnboardingRulesEvaluator {
  /** Reglas efectivas: catálogo + configuración guardada de la cuenta. */
  effectiveRules(saved: { ruleKey: string; enabled: boolean; severity: RuleSeverityEnum; config: Record<string, unknown> }[]): EffectiveRule[] {
    const byKey = new Map(saved.map((r) => [r.ruleKey, r]));
    return ONBOARDING_RULES.map((def) => {
      const s = byKey.get(def.ruleKey);
      if (def.fixed || !s) {
        return { ruleKey: def.ruleKey, enabled: true, severity: def.defaultSeverity, config: { ...(def.defaultConfig ?? {}), ...(s?.config ?? {}) } };
      }
      return { ruleKey: def.ruleKey, enabled: s.enabled, severity: s.severity, config: { ...(def.defaultConfig ?? {}), ...s.config } };
    });
  }

  evaluate(rules: EffectiveRule[], facts: OnboardingFacts): OnboardingEvaluation {
    const results: RuleResult[] = [];
    let blocked = false;
    let warnings = 0;
    for (const rule of rules.filter((r) => r.enabled)) {
      const problem = this.check(rule, facts);
      if (problem === undefined) continue; // no aplica
      if (problem === null) {
        results.push({ ruleKey: rule.ruleKey, outcome: 'pass', message: 'OK' });
        continue;
      }
      if (rule.ruleKey === 'existing_identity') {
        // Informativa: la persona se vincula; cuenta como advertencia solo si así se configuró como block.
        results.push({ ruleKey: rule.ruleKey, outcome: rule.severity === RuleSeverityEnum.Block ? 'warn' : 'info', message: problem });
        if (rule.severity === RuleSeverityEnum.Block) warnings += 1;
        continue;
      }
      if (rule.severity === RuleSeverityEnum.Block) {
        blocked = true;
        results.push({ ruleKey: rule.ruleKey, outcome: 'fail', message: problem });
      } else {
        warnings += 1;
        results.push({ ruleKey: rule.ruleKey, outcome: 'warn', message: problem });
      }
    }
    return { results, blocked, warnings, riskScore: Math.min(100, warnings * 20) };
  }

  /** `null` = pasa, `string` = problema, `undefined` = no aplica. */
  private check(rule: EffectiveRule, f: OnboardingFacts): string | null | undefined {
    const id = f.identity;
    switch (rule.ruleKey) {
      case 'invitation_valid':
        return f.invitationValid ? null : f.invitationProblem ?? 'La liga no es válida';
      case 'phone_verified':
        return f.phoneVerified ? null : 'El código de verificación no coincide';
      case 'required_fields': {
        const missing: string[] = [];
        if (!id.firstName) missing.push('nombre');
        if (!id.lastName) missing.push('apellidos');
        if (!id.phoneE164) missing.push('teléfono');
        for (const field of f.requiredFields) {
          if (!id[field as keyof typeof id]) missing.push(field === 'birthDate' ? 'fecha de nacimiento' : field.toUpperCase());
        }
        return missing.length ? `Faltan: ${missing.join(', ')}` : null;
      }
      case 'consents_accepted':
        return f.privacyAccepted ? null : 'Debes aceptar el aviso de privacidad';
      case 'custom_field_validation':
        return f.customFieldErrors.length ? f.customFieldErrors.join('; ') : null;
      case 'email_domain': {
        if (!f.allowedEmailDomains.length) return undefined;
        if (!id.email) return `Se requiere un email de ${f.allowedEmailDomains.join(', ')}`;
        const domain = id.email.split('@')[1];
        return f.allowedEmailDomains.includes(domain) ? null : `El email debe ser de ${f.allowedEmailDomains.join(', ')}`;
      }
      case 'curp_format':
        if (!id.curp) return undefined;
        return isValidCurp(id.curp) ? null : 'La CURP no es válida';
      case 'rfc_format':
        if (!id.rfc) return undefined;
        return isValidRfc(id.rfc) ? null : 'El RFC no es válido';
      case 'nss_format':
        if (!id.nss) return undefined;
        return isValidNss(id.nss) ? null : 'El NSS no es válido';
      case 'curp_rfc_consistency':
        if (!id.curp || !id.rfc || id.rfc.length !== 13) return undefined;
        return id.curp.slice(0, 10) === id.rfc.slice(0, 10) ? null : 'CURP y RFC no corresponden a la misma persona';
      case 'min_age': {
        if (f.ageYears === null) return undefined;
        const minAge = Number(rule.config.minAge ?? 18);
        return f.ageYears >= minAge ? null : `Edad mínima ${minAge} años (tiene ${f.ageYears})`;
      }
      case 'unique_in_account':
        return f.duplicatesInAccount.length ? `Ya registrado en la empresa: ${f.duplicatesInAccount.join(', ')}` : null;
      case 'existing_identity':
        return f.existsInOtherAccounts ? 'La persona ya trabaja para otra empresa en el Checador (se vincula su registro)' : undefined;
      case 'custom_regex': {
        const field = rule.config.field as string | null;
        const regex = rule.config.regex as string | null;
        if (!field || !regex) return undefined;
        const value = (id as Record<string, unknown>)[field] ?? f.customFields[field];
        if (value == null || value === '') return undefined;
        try {
          return new RegExp(regex).test(String(value)) ? null : String(rule.config.message ?? `«${field}» no cumple el formato`);
        } catch {
          return undefined;
        }
      }
      default:
        return undefined;
    }
  }
}
