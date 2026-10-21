import { RuleSeverityEnum } from '../entities';

export interface OnboardingRuleDefinition {
  ruleKey: string;
  label: string;
  description: string;
  defaultSeverity: RuleSeverityEnum;
  /** Las reglas fijas no se pueden apagar ni cambiar de severidad. */
  fixed?: boolean;
  defaultConfig?: Record<string, unknown>;
}

/** Catálogo de reglas de validación de alta (docs/05 §1). */
export const ONBOARDING_RULES: OnboardingRuleDefinition[] = [
  { ruleKey: 'invitation_valid', label: 'Liga vigente', description: 'La liga existe, no venció y le quedan usos', defaultSeverity: RuleSeverityEnum.Block, fixed: true },
  { ruleKey: 'phone_verified', label: 'Teléfono verificado', description: 'El código de WhatsApp/SMS coincide', defaultSeverity: RuleSeverityEnum.Block, fixed: true },
  { ruleKey: 'required_fields', label: 'Datos obligatorios', description: 'Nombre, apellidos y los campos que pide la liga', defaultSeverity: RuleSeverityEnum.Block, fixed: true },
  { ruleKey: 'consents_accepted', label: 'Aviso de privacidad', description: 'Aceptó el aviso de privacidad (LFPDPPP)', defaultSeverity: RuleSeverityEnum.Block, fixed: true },
  { ruleKey: 'custom_field_validation', label: 'Campos de la empresa', description: 'Los campos personalizados cumplen su formato', defaultSeverity: RuleSeverityEnum.Block },
  { ruleKey: 'email_domain', label: 'Dominio de email', description: 'El email pertenece a un dominio permitido por la liga', defaultSeverity: RuleSeverityEnum.Block },
  { ruleKey: 'curp_format', label: 'CURP válida', description: 'Estructura oficial y dígito verificador', defaultSeverity: RuleSeverityEnum.Block },
  { ruleKey: 'rfc_format', label: 'RFC válido', description: 'Estructura de persona física (13) o moral (12)', defaultSeverity: RuleSeverityEnum.Warn },
  { ruleKey: 'nss_format', label: 'NSS válido', description: '11 dígitos con dígito verificador', defaultSeverity: RuleSeverityEnum.Warn },
  { ruleKey: 'curp_rfc_consistency', label: 'CURP y RFC coinciden', description: 'Las primeras 10 posiciones de CURP y RFC son iguales', defaultSeverity: RuleSeverityEnum.Warn },
  { ruleKey: 'min_age', label: 'Edad mínima', description: 'Edad cumplida según CURP o fecha de nacimiento', defaultSeverity: RuleSeverityEnum.Block, defaultConfig: { minAge: 18 } },
  { ruleKey: 'unique_in_account', label: 'Sin duplicados', description: 'Teléfono, email y CURP no están ya registrados en la cuenta', defaultSeverity: RuleSeverityEnum.Block },
  { ruleKey: 'existing_identity', label: 'Persona conocida', description: 'Ya trabaja para otro patrón: se vincula, no se duplica', defaultSeverity: RuleSeverityEnum.Warn },
  { ruleKey: 'custom_regex', label: 'Regla propia', description: 'Expresión regular sobre un campo (config: field, regex, message)', defaultSeverity: RuleSeverityEnum.Warn, defaultConfig: { field: null, regex: null, message: null } },
];

export const ONBOARDING_RULES_BY_KEY = new Map(ONBOARDING_RULES.map((r) => [r.ruleKey, r]));
