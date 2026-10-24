import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { GeofenceModeEnum, PayPeriodFrequencyEnum } from '../entities';

export class UpsertCatalogItemDto {
  @IsString()
  @Length(1, 120)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  code?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateAccountSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 64) timeZone?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(6) weekStartsOn?: number;
  @ApiPropertyOptional({ enum: PayPeriodFrequencyEnum }) @IsOptional() @IsEnum(PayPeriodFrequencyEnum) payPeriodFrequency?: PayPeriodFrequencyEnum;
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultPolicyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultScheduleId?: string;
  @ApiPropertyOptional({ enum: GeofenceModeEnum }) @IsOptional() @IsIn(Object.values(GeofenceModeEnum)) geofenceMode?: GeofenceModeEnum;
  /** Mínimo 1 año tras la baja (LFT 804–805). */
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(20) retentionYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() privacyNoticeUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 20) privacyNoticeVersion?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() employerData?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsObject() branding?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsObject() featureFlags?: Record<string, boolean>;
}

export class ToggleDto {
  @IsBoolean()
  enabled: boolean;
}
