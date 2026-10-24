import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CustomFieldDefinition } from '../../core/api/models';
import { isMxMobile } from '../../shared/phone';

export const CURP_RE = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
export const RFC_RE = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
export const NSS_RE = /^\d{11}$/;

/** Validadores de Angular a partir de la definición del campo personalizado. */
export function validatorsFor(f: CustomFieldDefinition): ValidatorFn[] {
  const v: ValidatorFn[] = [];
  if (f.required) v.push(f.type === 'boolean' ? Validators.requiredTrue : Validators.required);
  const val = f.validation ?? {};
  if (val.regex) {
    try {
      v.push(Validators.pattern(new RegExp(val.regex)));
    } catch {
      /* regex inválida en la definición: la valida el servidor */
    }
  }
  if (val.minLength != null) v.push(Validators.minLength(val.minLength));
  if (val.maxLength != null) v.push(Validators.maxLength(val.maxLength));
  if (f.type === 'number') {
    if (val.min != null) v.push(Validators.min(val.min));
    if (val.max != null) v.push(Validators.max(val.max));
  }
  if (f.type === 'email') v.push(Validators.email);
  if (f.type === 'curp') v.push(Validators.pattern(CURP_RE));
  if (f.type === 'rfc') v.push(Validators.pattern(RFC_RE));
  return v;
}

/** El email debe ser de un dominio permitido por la liga (si la liga lo limita). */
export function emailDomainValidator(domains: string[]): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const value = String(c.value ?? '').trim().toLowerCase();
    if (!value || !domains.length) return null;
    const domain = value.split('@')[1] ?? '';
    return domains.includes(domain) ? null : { domain: domains.join(', ') };
  };
}

/** Quita vacíos y convierte números antes de enviar `customFields`. */
export function cleanCustomFields(defs: CustomFieldDefinition[], raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of defs) {
    const value = raw[f.key];
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) continue;
    out[f.key] = f.type === 'number' ? Number(value) : value;
  }
  return out;
}

/** El API junta varios errores con "; " — los mostramos como lista. */
export function splitServerErrors(message: string): string[] {
  return message
    .split(/;\s+|\.\s+(?=[A-ZÁÉÍÓÚÑ])/)
    .map((m) => m.trim())
    .filter(Boolean);
}

export const mxPhoneValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  !c.value || isMxMobile(String(c.value)) ? null : { phone: true };
