import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { CustomFieldEntityEnum, CustomFieldTypeEnum, CustomFieldValidation } from '../entities';

export class UpsertCustomFieldDto {
  @ApiProperty({ enum: CustomFieldEntityEnum }) @IsEnum(CustomFieldEntityEnum) entity: CustomFieldEntityEnum;
  /** slug: minúsculas, números y guion bajo. Inmutable una vez con valores. */
  @ApiProperty() @IsString() @Matches(/^[a-z][a-z0-9_]{1,59}$/, { message: 'La clave usa minúsculas, números y _ (ej. talla_uniforme)' }) key: string;
  @ApiProperty() @IsString() @Length(1, 120) label: string;
  @ApiProperty({ enum: CustomFieldTypeEnum }) @IsEnum(CustomFieldTypeEnum) type: CustomFieldTypeEnum;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() required?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() validation?: CustomFieldValidation;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() visibleToEmployee?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() editableByEmployee?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() askOnOnboarding?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showInReports?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() chartable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
