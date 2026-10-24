import { Injectable } from '@nestjs/common';
import { isValidCurp, isValidRfc, normalizePhoneE164 } from '@jc-attendance/rules-engine';
import { CustomFieldDefinition, CustomFieldTypeEnum } from '../entities';

export interface CustomFieldValidationResult {
  values: Record<string, unknown>;
  errors: string[];
}

export interface ValidateValuesOptions {
  /** Solo se aceptan claves editables por el empleado (alta / perfil). */
  asEmployee?: boolean;
  /** Validación parcial (PATCH): no exige obligatorios ausentes. */
  partial?: boolean;
  /** Solo los campos que se piden en la liga de alta. */
  onboarding?: boolean;
}

/**
 * Valida y normaliza los valores de campos personalizados contra sus
 * definiciones. Descarta claves desconocidas; devuelve errores legibles.
 */
@Injectable()
export class CustomFieldValuesRule {
  validate(
    definitions: CustomFieldDefinition[],
    input: Record<string, unknown> | undefined | null,
    options: ValidateValuesOptions = {},
  ): CustomFieldValidationResult {
    const values: Record<string, unknown> = {};
    const errors: string[] = [];
    const raw = input ?? {};
    const applicable = definitions.filter((d) => {
      if (options.onboarding) return d.askOnOnboarding;
      if (options.asEmployee) return d.editableByEmployee;
      return true;
    });

    for (const def of applicable) {
      const value = raw[def.key];
      const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) {
        if (def.required && !options.partial) errors.push(`«${def.label}» es obligatorio`);
        continue;
      }
      const result = this.coerce(def, value);
      if (typeof result === 'string') errors.push(`«${def.label}»: ${result}`);
      else values[def.key] = result.value;
    }
    return { values, errors };
  }

  private coerce(def: CustomFieldDefinition, value: unknown): { value: unknown } | string {
    const v = def.validation ?? {};
    switch (def.type) {
      case CustomFieldTypeEnum.Text: {
        const s = String(value).trim();
        if (v.minLength != null && s.length < v.minLength) return `mínimo ${v.minLength} caracteres`;
        if (v.maxLength != null && s.length > v.maxLength) return `máximo ${v.maxLength} caracteres`;
        if (v.regex && !new RegExp(v.regex).test(s)) return 'formato inválido';
        return { value: s };
      }
      case CustomFieldTypeEnum.Number: {
        const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
        if (!Number.isFinite(n)) return 'debe ser un número';
        if (v.min != null && n < v.min) return `mínimo ${v.min}`;
        if (v.max != null && n > v.max) return `máximo ${v.max}`;
        return { value: n };
      }
      case CustomFieldTypeEnum.Date: {
        const s = String(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) return 'fecha inválida (AAAA-MM-DD)';
        return { value: s };
      }
      case CustomFieldTypeEnum.Boolean:
        if (typeof value === 'boolean') return { value };
        if (['true', 'sí', 'si', '1'].includes(String(value).toLowerCase())) return { value: true };
        if (['false', 'no', '0'].includes(String(value).toLowerCase())) return { value: false };
        return 'debe ser sí o no';
      case CustomFieldTypeEnum.Select:
        if (!def.options.includes(String(value))) return `opción inválida (${def.options.join(', ')})`;
        return { value: String(value) };
      case CustomFieldTypeEnum.MultiSelect: {
        const list = Array.isArray(value) ? value.map(String) : String(value).split(',').map((s) => s.trim());
        const invalid = list.filter((x) => !def.options.includes(x));
        if (invalid.length) return `opciones inválidas: ${invalid.join(', ')}`;
        return { value: list };
      }
      case CustomFieldTypeEnum.Email: {
        const s = String(value).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'email inválido';
        return { value: s };
      }
      case CustomFieldTypeEnum.Phone: {
        const phone = normalizePhoneE164(String(value));
        if (!phone) return 'teléfono inválido';
        return { value: phone };
      }
      case CustomFieldTypeEnum.Curp: {
        const s = String(value).trim().toUpperCase();
        if (!isValidCurp(s)) return 'CURP inválida';
        return { value: s };
      }
      case CustomFieldTypeEnum.Rfc: {
        const s = String(value).trim().toUpperCase();
        if (!isValidRfc(s)) return 'RFC inválido';
        return { value: s };
      }
      default:
        return { value };
    }
  }
}
