import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PunchReviewStatusEnum, PunchTypeEnum } from '../entities';

/** Marcaje desde el PWA (empleado) o desde la consola (usuario de jc-core enlazado). */
export class RegisterPunchDto {
  @ApiPropertyOptional({ enum: PunchTypeEnum, description: 'Si se omite: entrada o salida según el último marcaje' })
  @IsOptional()
  @IsEnum(PunchTypeEnum)
  type?: PunchTypeEnum;

  @ApiProperty({ description: 'UUID generado por el dispositivo; reenviar el mismo no duplica' })
  @IsString()
  @Length(8, 80)
  idempotencyKey: string;

  @ApiProperty({ description: 'Hora del dispositivo (ISO)' }) @IsDateString() clientAt: string;
  @ApiPropertyOptional() @IsOptional() @IsLatitude() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsLongitude() lng?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100000) accuracyMeters?: number;
  /** Contenido del QR rotativo del kiosco escaneado. */
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) qrPayload?: string;
  /** Selfie como data URL JPEG/PNG (≤ 400 KB). */
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(560_000) @Matches(/^data:image\/(jpeg|png|webp);base64,/) selfieDataUrl?: string;
  /** El dispositivo lo guardó sin red y lo envía después. */
  @ApiPropertyOptional() @IsOptional() @IsBoolean() offline?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}

/** Marcaje en kiosco: número de empleado + PIN. */
export class KioskPunchDto {
  @ApiProperty() @IsString() @Length(1, 40) employeeNumber: string;
  @ApiProperty() @Matches(/^\d{4,6}$/) pin: string;
  @ApiPropertyOptional({ enum: PunchTypeEnum }) @IsOptional() @IsEnum(PunchTypeEnum) type?: PunchTypeEnum;
  @ApiProperty() @IsString() @Length(8, 80) idempotencyKey: string;
  @ApiProperty() @IsDateString() clientAt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(560_000) @Matches(/^data:image\/(jpeg|png|webp);base64,/) selfieDataUrl?: string;
}

/** Captura manual de un supervisor: motivo obligatorio. */
export class ManualPunchDto {
  @ApiProperty() @IsUUID() employmentId: string;
  @ApiProperty({ enum: PunchTypeEnum }) @IsEnum(PunchTypeEnum) type: PunchTypeEnum;
  @ApiProperty() @IsDateString() at: string;
  @ApiProperty() @IsString() @Length(5, 300) reason: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
  /** Si corrige un marcaje existente, este queda rechazado. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() replacesPunchId?: string;
}

export class ReviewPunchDto {
  @ApiProperty({ enum: ['approve', 'reject'] }) @IsIn(['approve', 'reject']) decision: 'approve' | 'reject';
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 300) comment?: string;
}

export class ListPunchesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
  @ApiPropertyOptional({ enum: PunchReviewStatusEnum }) @IsOptional() @IsEnum(PunchReviewStatusEnum) reviewStatus?: PunchReviewStatusEnum;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() flaggedOnly?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}
