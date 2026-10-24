import { Injectable } from '@nestjs/common';
import { CustomFieldDefinitionDao } from '../daos';
import { UpsertCustomFieldDto } from '../dtos';
import { CustomFieldTypeEnum } from '../entities';

@Injectable()
export class CustomFieldChecker {
  constructor(private readonly dao: CustomFieldDefinitionDao) {}

  async validateUpsert(accountId: string, dto: UpsertCustomFieldDto, id?: string): Promise<string[]> {
    const errors: string[] = [];
    const sameKey = await this.dao.findByKey(accountId, dto.entity, dto.key);
    if (sameKey && sameKey.id !== id) errors.push(`Ya existe un campo con la clave «${dto.key}»`);

    if ([CustomFieldTypeEnum.Select, CustomFieldTypeEnum.MultiSelect].includes(dto.type) && !dto.options?.length) {
      errors.push('Las listas necesitan al menos una opción');
    }
    if (dto.validation?.regex) {
      try {
        new RegExp(dto.validation.regex);
      } catch {
        errors.push('La expresión regular no es válida');
      }
    }
    if (id) {
      const current = await this.dao.findById(accountId, id);
      if (!current) return ['El campo no existe'];
      const keyOrTypeChanged = current.key !== dto.key || current.type !== dto.type || current.entity !== dto.entity;
      if (keyOrTypeChanged && (await this.dao.keyHasValues(accountId, current.entity, current.key))) {
        errors.push('La clave, el tipo y la entidad no se pueden cambiar porque ya hay datos capturados');
      }
    }
    return errors;
  }
}
