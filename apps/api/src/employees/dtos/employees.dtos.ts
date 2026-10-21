import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { StatusForEntityEnum } from '../../common';
import { OnboardingStatusEnum, PayTypeEnum } from '../entities';

/** Datos de la persona (identidad global). */
export class IdentityDataDto {
  @ApiProperty() @IsString() @Length(1, 120) firstName: string;
  @ApiProperty() @IsString() @Length(1, 120) lastName: string;
  @ApiPropertyOptional({ example: '+525512345678' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(18, 18) curp?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(12, 13) rfc?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(11, 11) nss?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string;
}

/** Datos laborales en la cuenta. */
export class EmploymentDataDto {
  /** Enlaza al usuario de jc-core (lumen-view/anestesia) para que cheque con su mismo login. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() coreUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 40) employeeNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() positionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() managerEmploymentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() defaultLocationId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUUID('4', { each: true }) allowedLocationIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsUUID() scheduleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() policyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() hireDate?: string;
  @ApiPropertyOptional({ enum: PayTypeEnum }) @IsOptional() @IsEnum(PayTypeEnum) payType?: PayTypeEnum;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) hourlyRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) dailySalary?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isMinor?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}

export class CreateEmployeeDto extends EmploymentDataDto {
  @ApiProperty({ type: IdentityDataDto }) @Type(() => IdentityDataDto) identity: IdentityDataDto;
}

export class UpdateEmployeeDto extends EmploymentDataDto {
  @ApiPropertyOptional({ type: IdentityDataDto }) @IsOptional() @Type(() => IdentityDataDto) identity?: Partial<IdentityDataDto>;
}

export class TerminateEmployeeDto {
  @ApiProperty() @IsDateString() terminationDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 300) reason?: string;
}

export class SetKioskPinDto {
  @ApiProperty({ description: '4 a 6 dígitos' }) @Matches(/^\d{4,6}$/, { message: 'El PIN es de 4 a 6 dígitos' }) pin: string;
}

export class ListEmployeesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() locationId?: string;
  @ApiPropertyOptional({ enum: StatusForEntityEnum }) @IsOptional() @IsEnum(StatusForEntityEnum) status?: StatusForEntityEnum;
  @ApiPropertyOptional({ enum: OnboardingStatusEnum }) @IsOptional() @IsEnum(OnboardingStatusEnum) onboardingStatus?: OnboardingStatusEnum;
  /** JSON con filtros exactos de campos personalizados: {"talla":"M"} */
  @ApiPropertyOptional() @IsOptional() @IsString() customFields?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() limit?: number;
}

/** El empleado edita su perfil: solo campos personalizados editables y su email. */
export class UpdateMyProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}
