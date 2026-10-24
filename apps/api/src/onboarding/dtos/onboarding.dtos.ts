import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ConsentKindEnum } from '../../employee-auth/entities';
import { IdentityDataDto, PartialIdentityDataDto } from '../../employees/dtos';
import { InvitationKindEnum, ReviewStatusEnum, RuleSeverityEnum } from '../entities';

export const INVITATION_REQUIRABLE_FIELDS = ['email', 'curp', 'rfc', 'nss', 'birthDate'] as const;

export class UpsertInvitationDto {
  @ApiProperty() @IsString() @Length(1, 120) name: string;
  @ApiPropertyOptional({ enum: InvitationKindEnum }) @IsOptional() @IsEnum(InvitationKindEnum) kind?: InvitationKindEnum;
  @ApiPropertyOptional() @IsOptional() @IsString() targetPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() targetEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultDepartmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultLocationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultScheduleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultPositionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(10000) maxUses?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requireApproval?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @Matches(/^[a-z0-9.-]+\.[a-z]{2,}$/, { each: true, message: 'Dominio inválido (ej. miempresa.com)' }) allowedEmailDomains?: string[];
  @ApiPropertyOptional({ enum: INVITATION_REQUIRABLE_FIELDS, isArray: true }) @IsOptional() @IsArray() @IsIn(INVITATION_REQUIRABLE_FIELDS as unknown as string[], { each: true }) requiredFields?: string[];
}

export class JoinOtpDto {
  @ApiProperty() @IsString() phone: string;
}

export class SubmitOnboardingDto {
  @ApiProperty({ type: IdentityDataDto }) @ValidateNested() @Type(() => IdentityDataDto) identity: IdentityDataDto;
  @ApiProperty({ description: 'Código recibido por WhatsApp/SMS en el teléfono de la identidad' }) @Matches(/^\d{6}$/) otpCode: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() customFields?: Record<string, unknown>;
  @ApiProperty({ enum: ConsentKindEnum, isArray: true }) @IsArray() @IsEnum(ConsentKindEnum, { each: true }) consents: ConsentKindEnum[];
}

export class ResubmitOnboardingDto {
  @ApiPropertyOptional({ type: IdentityDataDto }) @IsOptional() @ValidateNested() @Type(() => PartialIdentityDataDto) identity?: PartialIdentityDataDto;
  @ApiPropertyOptional() @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}

export class ReviewDecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500) comment?: string;
  /** Al aprobar se pueden completar datos laborales. */
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 40) employeeNumber?: string;
}

export class ListOnboardingQueryDto {
  @ApiPropertyOptional({ enum: ReviewStatusEnum }) @IsOptional() @IsEnum(ReviewStatusEnum) status?: ReviewStatusEnum;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}

export class UpdateOnboardingRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional({ enum: RuleSeverityEnum }) @IsOptional() @IsEnum(RuleSeverityEnum) severity?: RuleSeverityEnum;
  @ApiPropertyOptional() @IsOptional() @IsObject() config?: Record<string, unknown>;
}
